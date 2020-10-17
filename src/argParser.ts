/**
 * This might seem like overkill, but there's been variation in how we're handling these different
 * types of template params, so it helps to split into separate types for now.
 * 
 * We can revisit this in the future.
 */
export const NameToken = 'name';
export const UnescapedToken = '&';
export const PartialTemplateToken = '>';

export enum ArgType {
  EscapedParam,
  UnescapedParam,
  PartialTemplate
}

export class TemplateArg {
  name: string;
  argType: ArgType;
  description: string;
  commandLineFlags: string;
  defaultValue?: string;

  constructor(name: string, argType: ArgType, description: string, commandLineFlags: string, defaultValue?: string) {
    this.name = name;
    this.argType = argType;
    this.description = description;
    this.commandLineFlags = commandLineFlags;
    this.defaultValue = defaultValue;
  }
}

export function getFromParsedTemplate(parsedTemplate: any[], tokenFilter: string): any[] {
  return parsedTemplate
    .filter((t) => {
      return tokenFilter === t[0];
    })
    .map((o) => o[1]);

}

export function getEscapedParamsFromParsedTemplate(parsedTemplate: any[]): TemplateArg[] {
  return getFromParsedTemplate(parsedTemplate, NameToken).map((r) => {
    return new TemplateArg(r,
      ArgType.EscapedParam,
      'template parameters (default; escaped); leave blank to initalize parameterized',
      `--${r} <${r}>`,
      `{{${r}}}`
    )
  });
}

export function getUnescapedParamsFromParsedTemplate(parsedTemplate: any[]): TemplateArg[] {
  return getFromParsedTemplate(parsedTemplate, UnescapedToken).map((r) => {
    return new TemplateArg(r,
      ArgType.UnescapedParam,
      'unescaped template parameters; leave blank to initalize parameterized',
      `--${r} <${r}>`,
      `{{{${r}}}}`
    )
  });
}

export function getParamsFromParsedTemplate(parsedTemplate: any[]): TemplateArg[] {
  return getEscapedParamsFromParsedTemplate(parsedTemplate)
    .concat(getUnescapedParamsFromParsedTemplate(parsedTemplate));
}

export function getPartialTemplatesFromParsedTemplate(parsedTemplate: any[]): any[] {
  return getFromParsedTemplate(parsedTemplate, PartialTemplateToken).map((r) => {
    return new TemplateArg(r,
      ArgType.PartialTemplate,
      'partial template -- required',
      `--${r} <${r}>`
    )
  });
}
