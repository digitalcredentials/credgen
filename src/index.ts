const achievement = require("./templates/achievements/additiveManufacturing.json");
const issuer = require("./templates/issuers/xpro.json");
const { newCredential} = require("./credential");
// TODO: add commandpost cli parser

let credential = newCredential();

// same per issuer
credential.addIssuerData(issuer);

// same per achievement type (i.e. certificate for completing a given program)
credential.addAchievementData(achievement);

// the parts that vary per learner award
credential.addLearnerData( "https://example.org/path/to/credential", "did:example:learner", "Sample Learner");

console.log(JSON.stringify(credential, null, 4));
