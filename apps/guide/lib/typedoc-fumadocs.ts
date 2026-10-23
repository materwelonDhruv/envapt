import { Converter, DeclarationReflection, ReflectionKind } from 'typedoc';
import { MarkdownPageEvent, MarkdownRendererEvent, MarkdownTheme, MarkdownThemeContext } from 'typedoc-plugin-markdown';

import type { Application, Context, Reflection } from 'typedoc';
import type { MarkdownApplication } from 'typedoc-plugin-markdown';

// fumadocs' createRelativeLink resolves only hrefs that start with ./ or ../
class FumadocsContext extends MarkdownThemeContext {
    constructor(...args: ConstructorParameters<typeof MarkdownThemeContext>) {
        super(...args);
        const { signatureReturns } = this.partials;
        this.partials = {
            ...this.partials,
            // the plugin prints a mapped return type as escaped plain text
            signatureReturns: (model, options) => {
                const md = signatureReturns(model, options);
                if (model.type?.type !== 'mapped') return md;
                return md.replace(this.helpers.getReturnType(model.type), `\`\`\`ts\n${model.type.toString()}\n\`\`\``);
            }
        };
    }

    override urlTo(reflection: Reflection): string {
        const url = super.urlTo(reflection);
        return url === '' || url.startsWith('.') || url.startsWith('#') ? url : `./${url}`;
    }
}

class FumadocsTheme extends MarkdownTheme {
    override getRenderContext(page: MarkdownPageEvent<Reflection>): MarkdownThemeContext {
        return new FumadocsContext(this, page, this.application.options);
    }
}

export function load(app: Application): void {
    app.renderer.defineTheme('fumadocs', FumadocsTheme);

    // typedoc gives a module its entry file's name
    app.converter.on(Converter.EVENT_RESOLVE_BEGIN, (context: Context) => {
        const main = context.project.getChildByName('index');
        if (main?.kind === ReflectionKind.Module) main.name = 'envapt';
        const envapter = context.project.getChildByName(['envapt', 'Envapter']);
        if (envapter instanceof DeclarationReflection) {
            // its base class is internal and has no page to link
            envapter.extendedTypes = undefined;
            // every Envapter member is static
            const constructor = envapter.getChildByName('constructor');
            if (constructor !== undefined) context.project.removeReflection(constructor);
        }
    });

    const renderer = (app as MarkdownApplication).renderer;

    // content/docs/api/index.mdx already lists the modules
    renderer.on(MarkdownRendererEvent.BEGIN, (event) => {
        const root = event.pages.findIndex((page) => page.url === 'index.mdx');
        // the renderer keeps its own reference to this array
        if (root !== -1) event.pages.splice(root, 1);
    });

    // fumadocs requires a frontmatter title on every page
    renderer.on(MarkdownPageEvent.BEGIN, (page) => {
        page.frontmatter = { title: page.model.name, ...page.frontmatter };
    });
}
