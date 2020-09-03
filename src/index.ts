const achievement = require("./templates/achievements/additiveManufacturing.json");
const issuer = require("./templates/issuers/xpro.json");
const { newCredential} = require("./credential");
// TODO: add commandpost cli parser

let credential = newCredential();

// same per issuer
credential.addIssuerData(issuer);

// same per achievement type (i.e. certificate for completing a given program)
credential.addAchievementData(achievement);

// the parts that vary per learner
credential.addLearnerData("did:example:learner", "Sample Learner");

// the parts that vary per learner/credential issuance
credential.addCredentialInstanceData("https://example.org/path/to/credential", 
  "Additive Manufacturing: Technology Principles and Applications", 
  "This credential certifies that Sample Learner has successfully completed the Additive Manufacturing: Technology Principles and Applications program requirements");

console.log(JSON.stringify(credential.toJson(), null, 4));
