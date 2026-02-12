import * as admin from "firebase-admin";

admin.initializeApp({
    projectId: "code-wizards-9e993",
});

// Export function groups
export * as auth from "./auth";
export * as users from "./users";
export * as adminActions from "./admin"; // renamed to avoid conflict with admin sdk
export * as posts from "./posts";
export * as guidance from "./guidance";
export * as alumni from "./alumni";
export * as safety from "./safety";

// import * as functions from "firebase-functions";
// export const helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
