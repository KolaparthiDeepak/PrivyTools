import { useState } from 'react';
import { Button, Badge, Card, Input, Kbd, Segmented, Slider, Tooltip } from '../components/ui';
import { ProgressIndicator } from '../components/tool/ProgressIndicator';
import { ErrorState } from '../components/tool/ErrorState';
import { ResultCard } from '../components/tool/ResultCard';
import { BeforeAfterComparison } from '../components/tool/BeforeAfterComparison';
import LockAnim from '../components/tool/anims/LockAnim';
import ShrinkBarsAnim from '../components/tool/anims/ShrinkBarsAnim';
import StackAnim from '../components/tool/anims/StackAnim';
import PixelGridAnim from '../components/tool/anims/PixelGridAnim';
import ScanBeamAnim from '../components/tool/anims/ScanBeamAnim';
import ParticlesAnim from '../components/tool/anims/ParticlesAnim';

function Row({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-b border-border pb-8">
      <h2 className="font-mono text-xs uppercase tracking-widest text-dim">{title}</h2>
      <div className="flex flex-wrap items-start gap-4">{children}</div>
    </section>
  );
}

export default function DesignSystem() {
  const [reduced, setReduced] = useState(false);
  const [seg, setSeg] = useState('a');
  const [slider, setSlider] = useState(0.5);
  const demoResult = {
    blob: new Blob(['x']),
    filename: 'demo.pdf',
    originalBytes: 42.8 * 1024 ** 2,
    outputBytes: 8.4 * 1024 ** 2,
    meta: { pages: 12, documents: 3 },
  };

  return (
    <main role="main" className="mx-auto flex max-w-4xl flex-col gap-8 p-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Design system</h1>
        <label className="flex items-center gap-2 text-sm text-dim">
          <input type="checkbox" checked={reduced} onChange={(e) => setReduced(e.target.checked)} />
          reduced motion
        </label>
      </div>

      <Row title="Buttons">
        <Button variant="primary">Primary</Button>
        <Button>Subtle</Button>
        <Button variant="ghost">Ghost</Button>
        <Button disabled>Disabled</Button>
        <Kbd>\u2318K</Kbd>
      </Row>

      <Row title="Badges">
        <Badge>neutral</Badge>
        <Badge tone="accent">accent</Badge>
        <Badge tone="warn">warn - demo</Badge>
      </Row>

      <Row title="Inputs">
        <div className="w-64"><Input placeholder="Type here" /></div>
        <div className="w-64">
          <Segmented
            aria-label="demo"
            value={seg}
            onChange={setSeg}
            options={[
              { value: 'a', label: 'A' },
              { value: 'b', label: 'B' },
              { value: 'c', label: 'C' },
            ]}
          />
        </div>
        <div className="w-64">
          <Slider min={0} max={1} step={0.05} value={slider} onChange={setSlider} leftLabel="Low" rightLabel="High" aria-label="demo" />
        </div>
        <Tooltip content="A tooltip"><Button>Hover me</Button></Tooltip>
      </Row>

      <Row title="Cards">
        <Card className="w-48 p-4 text-sm">Static card</Card>
        <Card interactive className="w-48 p-4 text-sm">Interactive card</Card>
      </Row>

      <Row title="Progress">
        <div className="w-72"><ProgressIndicator ratio={0.62} label="Encrypting" /></div>
        <div className="w-72"><ProgressIndicator label="Working" /></div>
      </Row>

      <Row title="Result / error">
        <div className="w-80 rounded-lg border border-border"><ResultCard result={demoResult} onReset={() => {}} successVerb="PDFs merged" /></div>
        <div className="w-80 rounded-lg border border-border"><ErrorState message="We couldn't process this file." onRetry={() => {}} /></div>
      </Row>

      <Row title="Before / after">
        <div className="w-96">
          <BeforeAfterComparison
            before={<div className="grid size-full place-items-center bg-surface-hi text-dim">BEFORE</div>}
            after={<div className="grid size-full place-items-center bg-raise text-text">AFTER</div>}
            beforeLabel="ORIGINAL"
            afterLabel="RESULT"
          />
        </div>
      </Row>

      <Row title="Animations">
        <div className="w-40" data-accent="pdf"><LockAnim mode="add" reduced={reduced} /></div>
        <div className="w-40" data-accent="pdf"><ShrinkBarsAnim reduced={reduced} /></div>
        <div className="w-40" data-accent="pdf"><StackAnim count={4} reduced={reduced} /></div>
        <div className="w-40" data-accent="image"><PixelGridAnim reduced={reduced} /></div>
        <div className="w-56" data-accent="ai"><ScanBeamAnim reduced={reduced}><div className="size-full bg-surface-hi" /></ScanBeamAnim></div>
        <div className="w-40" data-accent="privacy"><ParticlesAnim reduced={reduced} /></div>
      </Row>
    </main>
  );
}
