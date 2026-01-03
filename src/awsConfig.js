// import { Amplify } from "aws-amplify";
import { fetchAuthSession } from "aws-amplify/auth";

// Amplify.configure({
//     Auth: {
//         region: "us-east-2",
//         userPoolId: "us-east-2_45z5OMePi",
//         userPoolWebClientId: "p2u5qdegml3hp60n6ohu52n2b",
//         authenticationFlowType: "USER_PASSWORD_AUTH",
//     },
// });


// Amplify.configure({
//     Auth: {
//         Cognito: {
//             region: "us-east-2",
//             userPoolId: "us-east-2_45z5OMePi",
//             userPoolClientId: "p2u5qdegml3hp60n6ohu52n2b",
//             loginWith: {
//                 username: true,
//                 email: true,
//             },
//         },
//     },
// });



// Amplify.configure({
//   Auth: {
//     Cognito: {
//       region: "us-east-2",
//       userPoolId: "us-east-2_45z5OMePi",
//       userPoolClientId: "p2u5qdegml3hp60n6ohu52n2b",

//       // ✅ Keep this for email/password
//       loginWith: {
//         username: true,
//         email: true,

//         // ✅ ADD THIS FOR GOOGLE / APPLE
//         oauth: {
//           domain: "us-east-245z5omepi.auth.us-east-2.amazoncognito.com",
//           scopes: ["openid", "email", "profile"],
//           redirectSignIn: [
//             "http://localhost:5173/",
//             "https://main.d229odkejwiim.amplifyapp.com/"
//           ],
//           redirectSignOut: [
//             "http://localhost:5173/",
//             "https://main.d229odkejwiim.amplifyapp.com/"
//           ],
//           responseType: "code",
//         },
//       },
//     },
//   },
// });



import { Amplify } from "aws-amplify";
Amplify.configure({
  Auth: {
    Cognito: {
      region: "us-east-2",
      userPoolId: "us-east-2_45z5OMePi",
      userPoolClientId: "p2u5qdegml3hp60n6ohu52n2b",

      loginWith: {
        oauth: {
          domain: "us-east-245z5omepi.auth.us-east-2.amazoncognito.com",
          scopes: ["openid", "email", "profile"],
          redirectSignIn: [
            "http://localhost:5173/auth/redirect",
            "https://main.d229odkejwiim.amplifyapp.com/auth/redirect"
          ],
          redirectSignOut: [
            "http://localhost:5173/",
            "https://main.d229odkejwiim.amplifyapp.com/"
          ],
          responseType: "code",
        },
      },
    },
  },
});
