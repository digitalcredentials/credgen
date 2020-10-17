
import { expect } from 'chai';
import 'mocha';

import { getUnescapedParamsFromParsedTemplate, ArgType, getEscapedParamsFromParsedTemplate, getPartialTemplatesFromParsedTemplate } from "./argParser";


describe("templates", () => {

  it("should get escaped params from parsed template", () => {
    // there is just 1 escaped param in this template -- issuerId
    const templateData = [
      ['text', ' {\n  "type": "Issuer",\n  "id": "', 0, 32],
      ['name', 'issuerId', 32, 44],
      ['text', '",\n  "image": "', 44, 59],
      ['&', 'issuerImage', 59, 76]];
    const params = getEscapedParamsFromParsedTemplate(templateData);
    expect(params.length).to.eq(1);

    expect(params[0].name).to.eq('issuerId');
    expect(params[0].argType).to.eq(ArgType.EscapedParam);
    expect(params[0].commandLineFlags).to.eq('--issuerId <issuerId>');
    expect(params[0].defaultValue!).to.eq('{{issuerId}}');
  });

  it("should get unescaped params from parsed template", () => {
    // there is just 1 unescaped param in this template -- issuerImage
    const templateData = [
      ['text', ' {\n  "type": "Issuer",\n  "id": "', 0, 32],
      ['name', 'issuerId', 32, 44],
      ['text', '",\n  "image": "', 44, 59],
      ['&', 'issuerImage', 59, 76]];
    const params = getUnescapedParamsFromParsedTemplate(templateData);
    expect(params.length).to.eq(1);

    expect(params[0].name).to.eq('issuerImage');
    expect(params[0].argType).to.eq(ArgType.UnescapedParam);
    expect(params[0].commandLineFlags).to.eq('--issuerImage <issuerImage>');
    expect(params[0].defaultValue!).to.eq('{{{issuerImage}}}');
  });

  it("should get partial template from parsed template", () => {
    // there is just 1 partial template in this template -- achievement
    const templateData = [
      ['text', '",\n  "name": "', 76, 90],
      ['name', 'issuerName', 90, 104],
      ['text', '",\n  "url": "', 104, 117],
      ['&', 'issuerUrl', 117, 132],
      ['text', '"\n}', 132, 135],
      ['>', 'achievement', 444, 460, ' ', 0, true]];

    const params = getPartialTemplatesFromParsedTemplate(templateData);
    expect(params.length).to.eq(1);

    expect(params[0].name).to.eq('achievement');
    expect(params[0].argType).to.eq(ArgType.PartialTemplate);
    expect(params[0].commandLineFlags).to.eq('--achievement <achievement>');
    expect(params[0].defaultValue).to.be.undefined;
  });

});


