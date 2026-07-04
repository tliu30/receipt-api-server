const fs = require('node:fs')
const { parse } = require('comment-parser')
const ejs = require('ejs')
const htmlFormat = require('html-format')
const markdownit = require('markdown-it')
const md = markdownit()

{
  const source = fs.readFileSync('docs/index.md', 'utf8')
  const html = md.render(source)
  fs.writeFileSync('gen/docs/index.html', html)
}

{
  const source = fs.readFileSync('src/index.ts', 'utf8')
  const parsed = parse(source, { spacing: 'preserve' })

  const template = `<div>
  <h2><%= method %> <%= name %></h2>

  <%- description %>

  <% if (types.length > 0) { %>
    <p><strong>Accepted <code>Content-Type</code>:</strong></p>
    <ul>
    <% for (const type of types) { %>
      <li><code><%= type %></code></li>
    <% } %>
    </ul>
  <% } %>

  <% if (params.length > 0) { %>
    <p><strong>Parameters:</strong></p>
    <ul>
    <% for (const param of params) { %>
      <li><code><%= param.name %>: <%= param.type %></code> - <%- param.description %></li>
    <% } %>
    </ul>
  <% } %>
  </div>
  `

  const generated = [
    '<h1>Receipt Printer API: Available routes</h1>',
    '<p><a href="..">App developer guide</a></p>'
  ]

  for (const docstring of parsed) {
    const description = md.render(docstring.description)
    const method = (docstring.tags.find(tag => tag.tag === 'method') ?? {}).name
    const types = docstring.tags.filter(tag => tag.tag === 'type').map(tag => tag.name)
    const name = (docstring.tags.find(tag => tag.tag === 'route') ?? {name: 'unspecified'}).name
    const params = docstring.tags.filter(tag => tag.tag === 'param')
    for (const param of params) {
      param.description = md.renderInline(param.description)
    }
    generated.push(ejs.render(template, {name, method, types, description, params}))
  }

  const finalHtml = htmlFormat(generated.join('\n'))

  fs.writeFileSync('gen/docs/api/index.html', finalHtml)
}
