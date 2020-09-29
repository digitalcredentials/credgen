import {encode} from 'node-base64-image';

// for now, it just provides utilities around json, but we'll add type info
export class Credential {
  credentialJson: any;

  constructor(credentialTemplate: any, issuerProfile: any, achievementProfile: any) {
    this.credentialJson = JSON.parse(JSON.stringify(credentialTemplate));
    this.credentialJson.issuer = {...issuerProfile};
    this.credentialJson.credentialSubject.hasAchieved = {...achievementProfile};
  }

  addLearnerData(subjectDid: string, subjectData: any) {
    this.credentialJson.credentialSubject = {...subjectData};
    this.credentialJson.credentialSubject.id = subjectDid;
  }

  updateIssuanceDate(issuanceDate?: string) {
    if (issuanceDate) {
      this.credentialJson.issuanceDate = issuanceDate;
    } else {
      this.credentialJson.issuanceDate = new Date().toISOString();
    }
  }

  addCredentialInstanceData(credentialId: string, credentialName?: string, credentialDescription?: string, image?: string) {
    this.credentialJson.id = credentialId;

    if (credentialName) {
      this.credentialJson.name = credentialName!;
    }
    if (credentialDescription) {
      this.credentialJson.description = credentialDescription!;
    }

    /*
    if (image) {
      const options = {
        string: true,
      };
       
      const imageBuffer = await encode(image!, options);
      this.credentialJson.image = imageBuffer;
    }*/


  }

  toJson() {
    return this.credentialJson;
  }
}


export function newCredentialFromProfiles(credentialTemplate: any, issuerProfile: any, achievementProfile: any) {
  return new Credential(credentialTemplate, issuerProfile, achievementProfile);
}
