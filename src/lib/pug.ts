import path from 'node:path';
import pug from 'pug';

const templateRoot = path.join(process.cwd(), 'src', 'templates');

export function renderPugTemplate(
  templateName: string,
  locals: Record<string, unknown> = {}
) {
  return pug.renderFile(path.join(templateRoot, templateName), {
    basedir: templateRoot,
    doctype: 'html',
    ...locals,
  });
}
