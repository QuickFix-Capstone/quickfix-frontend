#!/bin/bash

# Browser Cache & Storage Cleanup Script
# Use this to reset your testing environment

echo "🧹 QuickFix - Browser Cache Cleanup"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo "This script will help you clean browser cache and storage."
echo ""
echo "Choose what to clean:"
echo "1) Browser localStorage & sessionStorage (via JavaScript)"
echo "2) Delete test user from Cognito"
echo "3) Delete test user from database"
echo "4) Full cleanup (all of the above)"
echo "0) Cancel"
echo ""
read -p "Enter choice: " choice

case $choice in
    1)
        print_info "To clean browser storage, open your browser console and run:"
        echo ""
        echo "localStorage.clear();"
        echo "sessionStorage.clear();"
        echo "location.reload();"
        echo ""
        print_warning "Copy the above commands and paste them in your browser console (F12)"
        ;;
    
    2)
        read -p "Enter email to delete from Cognito: " email
        if [ -z "$email" ]; then
            print_warning "No email provided"
            exit 1
        fi
        
        print_info "Deleting user from Cognito..."
        if aws cognito-idp admin-delete-user \
            --user-pool-id us-east-2_45z5OMePi \
            --username "$email" \
            --region us-east-2 2>/dev/null; then
            print_success "User deleted from Cognito"
        else
            print_warning "User not found in Cognito or already deleted"
        fi
        ;;
    
    3)
        read -p "Enter email to delete from database: " email
        if [ -z "$email" ]; then
            print_warning "No email provided"
            exit 1
        fi
        
        print_warning "Database deletion requires direct SQL access"
        print_info "Run this SQL command in your database:"
        echo ""
        echo "DELETE FROM customers WHERE email = '$email';"
        echo ""
        ;;
    
    4)
        read -p "Enter email to fully cleanup: " email
        if [ -z "$email" ]; then
            print_warning "No email provided"
            exit 1
        fi
        
        print_info "Starting full cleanup for: $email"
        echo ""
        
        # Delete from Cognito
        print_info "1. Deleting from Cognito..."
        if aws cognito-idp admin-delete-user \
            --user-pool-id us-east-2_45z5OMePi \
            --username "$email" \
            --region us-east-2 2>/dev/null; then
            print_success "Deleted from Cognito"
        else
            print_warning "Not found in Cognito (may already be deleted)"
        fi
        
        # Database cleanup instructions
        echo ""
        print_info "2. Database cleanup:"
        print_warning "Run this SQL command in your database:"
        echo ""
        echo "DELETE FROM customers WHERE email = '$email';"
        echo ""
        
        # Browser cleanup instructions
        echo ""
        print_info "3. Browser cleanup:"
        print_warning "Open browser console (F12) and run:"
        echo ""
        echo "localStorage.clear(); sessionStorage.clear(); location.reload();"
        echo ""
        
        print_success "Cleanup initiated!"
        ;;
    
    0)
        print_info "Cancelled"
        exit 0
        ;;
    
    *)
        print_warning "Invalid choice"
        exit 1
        ;;
esac

echo ""
print_info "After cleanup, you can test with a fresh email address"
print_info "Generate one with: ./test-customer-groups.sh (option 5)"
