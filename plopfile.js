/** @type {import('plop').PlopGeneratorConfig} */
export default function (plop) {
  // FSD Feature generator
  plop.setGenerator('feature', {
    description: 'Create a new FSD feature',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Feature name (e.g., notifications):',
      },
    ],
    actions: [
      {
        type: 'add',
        path: 'apps/portal/src/features/{{dashCase name}}/model/{{camelCase name}}Slice.ts',
        templateFile: 'generators/templates/featureSlice.ts.hbs',
      },
      {
        type: 'add',
        path: 'apps/portal/src/features/{{dashCase name}}/index.ts',
        template: "export { {{camelCase name}}Slice } from './model/{{camelCase name}}Slice';\n",
      },
    ],
  });

  // FSD Entity generator
  plop.setGenerator('entity', {
    description: 'Create a new FSD entity with RTK Query endpoints',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Entity name (e.g., meter):',
      },
    ],
    actions: [
      {
        type: 'add',
        path: 'apps/portal/src/entities/{{dashCase name}}/index.ts',
        templateFile: 'generators/templates/entity.ts.hbs',
      },
    ],
  });

  // FSD Page generator
  plop.setGenerator('page', {
    description: 'Create a new FSD page with route',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Page name (e.g., settings):',
      },
    ],
    actions: [
      {
        type: 'add',
        path: 'apps/portal/src/pages/{{dashCase name}}.tsx',
        templateFile: 'generators/templates/route.tsx.hbs',
      },
      {
        type: 'add',
        path: 'apps/portal/src/pages/{{dashCase name}}/-{{pascalCase name}}Page.tsx',
        templateFile: 'generators/templates/page.tsx.hbs',
      },
      {
        type: 'add',
        path: 'apps/portal/src/pages/{{dashCase name}}/-{{pascalCase name}}Page.module.css',
        template: '.page {\n  padding: 1.5rem;\n}\n\n.title {\n  font-size: 1.5rem;\n  font-weight: 700;\n  margin-bottom: 1.5rem;\n}\n',
      },
    ],
  });
}
