#!/bin/bash

# Customer Group Testing Script
# Tests the Cognito customer group integration

set -e

echo "🧪 Customer Group Integration Test"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
USER_POOL_ID="us-east-2_45z5OMePi"
REGION="us-east-2"
GROUP_NAME="customer"

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to check if AWS CLI is installed
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed"
        echo "Install it with: brew install awscli"
        exit 1
    fi
    print_success "AWS CLI is installed"
}

# Function to check if customer group exists
check_group_exists() {
    print_info "Checking if 'customer' group exists in Cognito..."
    
    if aws cognito-idp get-group \
        --user-pool-id "$USER_POOL_ID" \
        --group-name "$GROUP_NAME" \
        --region "$REGION" &> /dev/null; then
        print_success "Customer group exists in Cognito"
        return 0
    else
        print_error "Customer group does NOT exist in Cognito"
        print_warning "Create it with: aws cognito-idp create-group --user-pool-id $USER_POOL_ID --group-name customer --region $REGION"
        return 1
    fi
}

# Function to list users in customer group
list_group_members() {
    print_info "Listing users in 'customer' group..."
    
    USERS=$(aws cognito-idp list-users-in-group \
        --user-pool-id "$USER_POOL_ID" \
        --group-name "$GROUP_NAME" \
        --region "$REGION" \
        --query 'Users[].{Username:Username,Email:Attributes[?Name==`email`].Value|[0],Status:UserStatus}' \
        --output table 2>/dev/null)
    
    if [ -z "$USERS" ]; then
        print_warning "No users in customer group yet"
    else
        echo "$USERS"
    fi
}

# Function to check specific user
check_user() {
    local email=$1
    
    if [ -z "$email" ]; then
        print_error "No email provided"
        return 1
    fi
    
    print_info "Checking user: $email"
    
    # Get user details
    USER_INFO=$(aws cognito-idp admin-get-user \
        --user-pool-id "$USER_POOL_ID" \
        --username "$email" \
        --region "$REGION" 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        print_success "User exists in Cognito"
        
        # Check groups
        GROUPS=$(echo "$USER_INFO" | grep -A 10 "Groups" | grep "GroupName" | awk '{print $2}' | tr -d '",')
        
        if echo "$GROUPS" | grep -q "customer"; then
            print_success "User IS in 'customer' group"
        else
            print_error "User is NOT in 'customer' group"
            print_info "Current groups: ${GROUPS:-none}"
            
            # Offer to add to group
            read -p "Add user to customer group? (y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                add_user_to_group "$email"
            fi
        fi
    else
        print_error "User does not exist in Cognito"
    fi
}

# Function to add user to customer group
add_user_to_group() {
    local email=$1
    
    print_info "Adding $email to customer group..."
    
    if aws cognito-idp admin-add-user-to-group \
        --user-pool-id "$USER_POOL_ID" \
        --username "$email" \
        --group-name "$GROUP_NAME" \
        --region "$REGION"; then
        print_success "User added to customer group"
    else
        print_error "Failed to add user to group"
    fi
}

# Function to generate test email
generate_test_email() {
    local timestamp=$(date +%s)
    local email="test-customer-${timestamp}@example.com"
    echo "$email"
}

# Main menu
show_menu() {
    echo ""
    echo "Choose an option:"
    echo "1) Check if customer group exists"
    echo "2) List all users in customer group"
    echo "3) Check specific user"
    echo "4) Add user to customer group"
    echo "5) Generate test email"
    echo "6) Run all checks"
    echo "0) Exit"
    echo ""
    read -p "Enter choice: " choice
    
    case $choice in
        1)
            check_group_exists
            show_menu
            ;;
        2)
            list_group_members
            show_menu
            ;;
        3)
            read -p "Enter user email: " email
            check_user "$email"
            show_menu
            ;;
        4)
            read -p "Enter user email: " email
            add_user_to_group "$email"
            show_menu
            ;;
        5)
            email=$(generate_test_email)
            print_success "Generated test email: $email"
            echo "$email" | pbcopy 2>/dev/null && print_info "Copied to clipboard!" || true
            show_menu
            ;;
        6)
            check_aws_cli
            check_group_exists
            list_group_members
            show_menu
            ;;
        0)
            print_info "Goodbye!"
            exit 0
            ;;
        *)
            print_error "Invalid choice"
            show_menu
            ;;
    esac
}

# Run initial checks
check_aws_cli
echo ""

# Show menu
show_menu
