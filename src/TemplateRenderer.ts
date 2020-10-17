import mustache from "mustache";
import { getPartialTemplatesFromParsedTemplate, getParamsFromParsedTemplate, TemplateArg } from "./argParser";


interface KVP {
  key: string;
  value: any;
}


export class TemplateRenderer {
  templateName: string;
  template: string;
  parsedTemplate: any[];
  constructor(templateName: string, template: string) {
    this.templateName = templateName;
    this.template = template;
    this.parsedTemplate = mustache.parse(template);
  }

  name(): string {
    return this.templateName;
  }

  params(): TemplateArg[] {
    return getParamsFromParsedTemplate(this.parsedTemplate);
  }

  partials(): TemplateArg[] {
    return [];
  }

  async render(opts): Promise<string> {
    let rendered = mustache.render(this.template, opts);
    let reformatted = JSON.stringify(JSON.parse(rendered), null, 2);
    return reformatted;
  }

}

export class TemplateRendererWithPartials extends TemplateRenderer {
  partialExpander: (key: string, value: string) => Promise<any>;

  constructor(templateName: string, template: string, partialExpander: (key: string, value: string) => Promise<any>) {
    super(templateName, template);
    this.partialExpander = partialExpander;
  }

  partials(): TemplateArg[] {
    return getPartialTemplatesFromParsedTemplate(this.parsedTemplate);
  }

  async getExpandedPartialMap(opts: any, partials: any): Promise<any> {
    let pe = this.partialExpander;
    let expandedPartials = await Promise.all(partials.map(async function (ta: TemplateArg) {
      const name = ta.name;
      let t = await pe(name, opts[name]);
      return { key: name, value: t };
    }));

    let partialMap = expandedPartials.reduce((map, val) => {
      let foo = val as KVP;
      map[foo.key] = JSON.stringify(foo.value);
      return map;
    }, {});
    return partialMap;
  }

  async render(opts): Promise<string> {
    let partialMap = await this.getExpandedPartialMap(opts, this.partials());
    let rendered = mustache.render(this.template, opts, partialMap);
    let reformatted = JSON.stringify(JSON.parse(rendered), null, 2);
    return reformatted;
  }
}

