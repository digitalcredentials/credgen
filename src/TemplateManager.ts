import { Storage } from '@tweedegolf/storage-abstraction';
import mustache from "mustache";
import path from "path";
import { TemplateArg } from "./argParser";
import { TemplateRenderer, TemplateRendererWithPartials } from "./TemplateRenderer";
import { readableToString } from './utils';

export const JsonFileExtension = '.json';

export function getBucketName(metaTemplateName: string) {
  return `${metaTemplateName}s`;
}

export class TemplateManager {
  metaTemplateName: string;
  bucketName: string;
  //metaTemplate: string;
 // parsedMetaTemplate: any[];
  s: Storage;
  renderer: TemplateRenderer;

  constructor(metaTemplateName: string, renderer: TemplateRenderer) {
    this.metaTemplateName = metaTemplateName;
    this.bucketName = getBucketName(metaTemplateName);
    this.renderer = renderer;
  }

  setStorage(storage: Storage) {
    this.s = storage;
  }

  params(): TemplateArg[] {
    return this.renderer.params();
  }

  partials(): TemplateArg[] {
    return this.renderer.partials();
  }

  async init(templateName: string, opts: any): Promise<any> {
    const fileName = `${templateName}${JsonFileExtension}`;
    let reformatted = await this.renderer.render(opts);
    await this.s.selectBucket(this.bucketName);
    return this.s.addFileFromBuffer(Buffer.from(reformatted, 'utf8'), `${fileName}`)
      .then(() => {
        // resolve full path to inform user
        let config = this.s.getConfiguration();
        let fullPath = path.join(config['directory'], '..', this.bucketName, fileName);
        return {
          templateName: templateName,
          fileName: `${fullPath}`
        };
      });
  }

  async get(templateName: string): Promise<any> {
    await this.s.selectBucket(this.bucketName);
    const r = await this.s.getFileAsReadable(`${templateName}${JsonFileExtension}`);
    return readableToString(r).then((data) => {
      return JSON.parse(data);
    });
  }

  async list(): Promise<string[]> {
    await this.s.selectBucket(this.bucketName);
    const f = await this.s.listFiles();
    return f.map(g => g[0].slice(0, -JsonFileExtension.length));
  }

  async remove(templateName: string): Promise<any> {
    return this.s.selectBucket(this.bucketName)
      .then(t => {
        return this.s.removeFile(`${templateName}${JsonFileExtension}`);
      }).catch((err) => {
        console.error(err);
        throw err;
      });
  }
}
