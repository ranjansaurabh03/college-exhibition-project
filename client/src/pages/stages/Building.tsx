import { ArrowDown, ArrowRight, Database, Download, FileCode2, Folder, Laptop, LoaderCircle, Plus, Server, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CodeViewer } from '../../components/CodeViewer'
import { Button, Card, Field, TextInput, cx } from '../../components/ui'
import { StatTile } from '../../components/viz'
import { downloadBlob } from '../../lib/download'
import { FIELD_PRESETS } from '../../lib/engine/building'
import { fieldsOrDefault, generateStarter, names, type GeneratedFile } from '../../lib/engine/codegen'
import { grouped } from '../../lib/engine/scoping'
import { uid } from '../../lib/factory'
import { useProjects } from '../../lib/store'
import type { Building as BuildingData, EntityField, FieldType } from '../../lib/types'
import type { StageProps } from '../Workspace'

const TYPES: FieldType[] = ['String', 'Number', 'Boolean', 'Date']

export default function Building({ project }: StageProps) {
  const patch = useProjects((s) => s.patch)
  const b = project.building
  const set = (partial: Partial<BuildingData>) => patch(project.id, 'building', partial)
  const files = useMemo(() => generateStarter(project), [project])
  const n = names(project)

  return (
    <div className="space-y-6">
      <ModelDesigner building={b} set={set} />
      <Architecture project={project} />
      <CodeExplorer files={files} slug={n.slug} product={n.product} />
      <LaunchPlan project={project} />
    </div>
  )
}

function ModelDesigner({ building: b, set }: { building: BuildingData; set: (p: Partial<BuildingData>) => void }) {
  const setField = (id: string, partial: Partial<EntityField>) => set({ fields: b.fields.map((f) => (f.id === id ? { ...f, ...partial } : f)) })
  return (
    <Card className="p-5 sm:p-6">
      <h2 className="text-lg font-bold text-espresso">MongoDB backend: design the data model</h2>
      <p className="text-sm text-muted">
        One core object, only the fields the core flow needs. Documents are stored as flexible JSON-like BSON, so you can
        add fields later without migrations.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,18rem)_1fr] sm:items-end">
        <Field label="Core object (singular)" hint="e.g. Order, Booking, Listing, Task" htmlFor="field-entityName">
          <TextInput id="field-entityName" value={b.entityName} onChange={(e) => set({ entityName: e.target.value })} placeholder="Order" />
        </Field>
        <div className="flex flex-wrap gap-1.5 pb-6">
          <span className="self-center text-xs text-muted">Start from:</span>
          {Object.keys(FIELD_PRESETS).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => set({ entityName: k, fields: FIELD_PRESETS[k].map((f) => ({ ...f, id: uid('b_') })) })}
              className="rounded-full border border-line bg-paper px-3 py-1 text-xs font-semibold text-espresso hover:border-tan"
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-2 overflow-hidden rounded-xl border border-line" id="field-fields" tabIndex={-1}>
        <div className="grid grid-cols-[minmax(0,1fr)_8rem_5.5rem_2.5rem] gap-2 bg-cream/70 px-3 py-2 text-xs font-semibold text-muted">
          <span>Field</span>
          <span>Type</span>
          <span>Required</span>
          <span />
        </div>
        <ul className="divide-y divide-line">
          {b.fields.map((f) => (
            <li key={f.id} className="grid grid-cols-[minmax(0,1fr)_8rem_5.5rem_2.5rem] items-center gap-2 px-3 py-2">
              <TextInput className="h-9 font-mono text-[13px]" value={f.name} aria-label="Field name" onChange={(e) => setField(f.id, { name: e.target.value })} />
              <select
                aria-label={`Type of ${f.name}`}
                value={f.type}
                onChange={(e) => setField(f.id, { type: e.target.value as FieldType })}
                className="h-9 rounded-xl border border-line bg-white px-2 text-sm"
              >
                {TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="size-4 accent-cocoa" checked={f.required} onChange={(e) => setField(f.id, { required: e.target.checked })} />
                <span className="sr-only sm:not-sr-only">Yes</span>
              </label>
              <button type="button" onClick={() => set({ fields: b.fields.filter((x) => x.id !== f.id) })} className="rounded-lg p-1.5 text-muted hover:bg-bad/10 hover:text-bad" aria-label={`Remove ${f.name}`}>
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
          <li className="px-3 py-2">
            <Button variant="ghost" size="sm" onClick={() => set({ fields: [...b.fields, { id: uid('b_'), name: '', type: 'String', required: false }] })}>
              <Plus className="size-4" /> Add field
            </Button>
          </li>
        </ul>
      </div>
      <p className="mt-2 text-xs text-muted">
        <code className="font-mono">owner</code>, <code className="font-mono">createdAt</code> and <code className="font-mono">updatedAt</code> are added automatically, with an index on{' '}
        <code className="font-mono">{'{ owner: 1, createdAt: -1 }'}</code>.
      </p>
    </Card>
  )
}

function Architecture({ project }: StageProps) {
  const n = names(project)
  const fields = fieldsOrDefault(project)
  const tiers = [
    {
      icon: Laptop,
      title: 'React frontend',
      sub: 'Vite · minimal pages',
      items: ['Log in / Sign up', `${n.Entities} list`, `New ${n.entity} form`],
    },
    {
      icon: Server,
      title: 'Express REST API',
      sub: 'Node.js · JWT auth',
      items: ['POST /api/auth/register', 'POST /api/auth/login', `GET · POST /api/${n.entities}`, `PATCH · DELETE /api/${n.entities}/:id`],
    },
    {
      icon: Database,
      title: 'MongoDB',
      sub: 'Mongoose schemas',
      items: ['users { name, email, passwordHash }', `${n.entities} { owner, ${fields.map((f) => f.name).join(', ')} }`],
    },
  ]
  return (
    <Card className="p-5 sm:p-6">
      <h2 className="text-lg font-bold text-espresso">Architecture</h2>
      <p className="text-sm text-muted">React components fetch and push data with fetch(); Express routes validate and talk to MongoDB through Mongoose.</p>
      <div className="mt-5 flex flex-col items-stretch gap-2 lg:flex-row lg:items-stretch">
        {tiers.map((t, i) => (
          <div key={t.title} className="flex flex-col items-stretch gap-2 lg:flex-1 lg:flex-row lg:items-center">
            <div className="flex-1 rounded-2xl border border-line bg-white/70 p-4">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-sand text-cocoa">
                  <t.icon className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-semibold leading-tight text-espresso">{t.title}</p>
                  <p className="text-xs text-muted">{t.sub}</p>
                </div>
              </div>
              <ul className="mt-3 space-y-1">
                {t.items.map((it) => (
                  <li key={it} className="break-words rounded-md bg-cream px-2 py-1 font-mono text-[11.5px] text-ink">
                    {it}
                  </li>
                ))}
              </ul>
            </div>
            {i < tiers.length - 1 ? (
              <div className="flex items-center justify-center text-tan" aria-hidden="true">
                <ArrowDown className="size-5 lg:hidden" />
                <ArrowRight className="hidden size-5 lg:block" />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </Card>
  )
}

interface TreeNode {
  name: string
  path: string
  children?: TreeNode[]
}

function buildTree(files: GeneratedFile[]): TreeNode[] {
  const root: TreeNode = { name: '', path: '', children: [] }
  for (const f of files) {
    const parts = f.path.split('/')
    let node = root
    parts.forEach((part, i) => {
      const path = parts.slice(0, i + 1).join('/')
      let child = node.children!.find((c) => c.name === part)
      if (!child) {
        child = i === parts.length - 1 ? { name: part, path } : { name: part, path, children: [] }
        node.children!.push(child)
      }
      node = child
    })
  }
  const sort = (nodes: TreeNode[]): TreeNode[] =>
    nodes
      .sort((a, b) => Number(!!b.children) - Number(!!a.children) || a.name.localeCompare(b.name))
      .map((x) => (x.children ? { ...x, children: sort(x.children) } : x))
  return sort(root.children!)
}

function CodeExplorer({ files, slug, product }: { files: GeneratedFile[]; slug: string; product: string }) {
  const [selected, setSelected] = useState(
    () => files.find((f) => f.path.startsWith('server/src/routes/') && !f.path.endsWith('/auth.js'))?.path ?? files[0].path,
  )
  const [zipping, setZipping] = useState(false)
  const tree = useMemo(() => buildTree(files), [files])
  const current = files.find((f) => f.path === selected) ?? files[0]
  const totalLines = files.reduce((s, f) => s + f.content.split('\n').length, 0)

  async function downloadZip() {
    setZipping(true)
    try {
      const { default: JSZip } = await import('jszip')
      const zip = new JSZip()
      for (const f of files) zip.file(`${slug}/${f.path}`, f.content)
      downloadBlob(`${slug}-mvp-starter.zip`, await zip.generateAsync({ type: 'blob' }))
    } finally {
      setZipping(false)
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4 p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-bold text-espresso">Code generation: your MERN starter</h2>
          <p className="max-w-xl text-sm text-muted">
            Production-style code, not just advice: auth flow, data model, REST routes and React pages for {product}. Updates live as you
            change the model.
          </p>
        </div>
        <Button onClick={downloadZip} disabled={zipping}>
          {zipping ? <LoaderCircle className="size-4 animate-spin" /> : <Download className="size-4" />} Download .zip
        </Button>
      </div>
      <div className="grid gap-3 px-5 pb-5 sm:grid-cols-3 sm:px-6">
        <StatTile label="Files" value={files.length} />
        <StatTile label="Lines of code" value={totalLines.toLocaleString()} />
        <StatTile label="Stack" value="MERN" sub="Express 5 · Mongoose 9 · React 19 · Vite 8" />
      </div>
      <div className="grid border-t border-line md:grid-cols-[230px_minmax(0,1fr)]">
        <nav aria-label="Generated files" className="max-h-[480px] overflow-auto border-b border-line bg-cream/50 p-2 md:border-b-0 md:border-r">
          <Tree nodes={tree} depth={0} selected={current.path} onSelect={setSelected} />
        </nav>
        <div className="min-w-0">
          <div className="flex items-center gap-2 border-b border-line bg-paper px-4 py-2 font-mono text-xs text-muted">
            <FileCode2 className="size-3.5" aria-hidden="true" /> {current.path}
          </div>
          <div className="max-h-[440px] overflow-auto">
            <CodeViewer path={current.path} code={current.content} />
          </div>
        </div>
      </div>
    </Card>
  )
}

function Tree({ nodes, depth, selected, onSelect }: { nodes: TreeNode[]; depth: number; selected: string; onSelect: (p: string) => void }) {
  return (
    <ul>
      {nodes.map((node) =>
        node.children ? (
          <li key={node.path}>
            <p className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-espresso" style={{ paddingLeft: depth * 12 + 8 }}>
              <Folder className="size-3.5 text-tan" aria-hidden="true" /> {node.name}
            </p>
            <Tree nodes={node.children} depth={depth + 1} selected={selected} onSelect={onSelect} />
          </li>
        ) : (
          <li key={node.path}>
            <button
              type="button"
              onClick={() => onSelect(node.path)}
              aria-current={selected === node.path ? 'true' : undefined}
              className={cx(
                'flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left font-mono text-xs',
                selected === node.path ? 'bg-cocoa text-cream' : 'text-ink hover:bg-sand',
              )}
              style={{ paddingLeft: depth * 12 + 8 }}
            >
              {node.name}
            </button>
          </li>
        ),
      )}
    </ul>
  )
}

function LaunchPlan({ project }: StageProps) {
  const n = names(project)
  // Week 1 already covers sign-up and log-in, so don't schedule auth twice.
  const keep = grouped(project.scoping.features)
    .keep.map((f) => f.name)
    .filter((name) => !/(log ?in|sign ?(up|in)|auth|account)/i.test(name))
  const half = Math.ceil(keep.length / 2)
  const weeks = [
    {
      title: 'Week 1: foundations',
      items: ['Create a free MongoDB Atlas cluster', 'Run the starter locally', 'Auth: sign up and log in', `${n.Entity} model and CRUD API`],
    },
    {
      title: 'Week 2: the core flow',
      items: keep.slice(0, half).length ? keep.slice(0, half) : ['Build the first half of the core flow'],
    },
    {
      title: 'Week 3: ship it',
      items: [...keep.slice(half), 'Deploy API and web app', 'Put it in front of 10 real users'],
    },
  ]
  return (
    <Card className="p-5 sm:p-6">
      <h2 className="text-lg font-bold text-espresso">Three-week build plan</h2>
      <p className="text-sm text-muted">Only the features you kept in Scoping. Everything else waits for real user feedback.</p>
      <ol className="mt-5 grid gap-4 md:grid-cols-3">
        {weeks.map((w) => (
          <li key={w.title} className="rounded-2xl border border-line bg-white/60 p-4">
            <p className="font-semibold text-espresso">{w.title}</p>
            <ul className="mt-2 space-y-1.5">
              {w.items.map((it) => (
                <li key={it} className="flex gap-2 text-sm text-ink/85">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-tan" aria-hidden="true" /> {it}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </Card>
  )
}
