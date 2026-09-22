import { useMemo, useState } from 'react';
import { getTool } from '../../tools/registry';
import { ToolHeader } from '../../components/tool/ToolHeader';
import { SplitTool, type Direction } from '../../components/dev/SplitTool';
import { CheckField, SelectField, TextField } from '../../components/dev/OptionFields';
import {
  jasyptDecrypt, jasyptEncrypt, isAesAlgorithm, JASYPT_ALGORITHMS, type JasyptOptions,
} from '../../services/dev/jasypt';

const tool = getTool('dev-jasypt')!;

export default function Jasypt() {
  const [opts, setOpts] = useState<JasyptOptions>({
    password: '',
    algorithm: 'PBEWITHHMACSHA512ANDAES_256',
    iterations: 1000,
    randomIv: true,
    encoding: 'base64',
    wrapEnc: false,
  });
  const set = <K extends keyof JasyptOptions>(k: K, v: JasyptOptions[K]) => setOpts((o) => ({ ...o, [k]: v }));
  const aes = isAesAlgorithm(opts.algorithm);

  const directions = useMemo<Direction[]>(() => [
    {
      id: 'dec', label: 'Decrypt',
      transform: (s) => jasyptDecrypt(s, opts),
      inputLanguage: 'text', outputLanguage: 'text',
      downloadName: 'decrypted.txt', downloadType: 'text/plain',
    },
    {
      id: 'enc', label: 'Encrypt',
      transform: (s) => jasyptEncrypt(s, opts),
      inputLanguage: 'text', outputLanguage: 'text',
      downloadName: 'encrypted.txt', downloadType: 'text/plain',
    },
  ], [opts]);

  return (
    <main role="main" className="mx-auto flex max-w-5xl flex-col gap-8 p-6 sm:p-10">
      <ToolHeader
        tool={tool}
        title="Jasypt encrypt and decrypt."
        subtitle="Byte-compatible with Jasypt and jasypt-spring-boot. The password never leaves your device."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <TextField
          label="Password"
          secret
          value={opts.password}
          onChange={(v) => set('password', v)}
          placeholder="jasypt.encryptor.password"
          className="lg:col-span-2"
        />
        <SelectField label="Algorithm" value={opts.algorithm} options={JASYPT_ALGORITHMS} onChange={(v) => set('algorithm', v)} className="lg:col-span-2" />
        <TextField
          label="Iterations"
          type="number"
          min={1}
          value={String(opts.iterations)}
          onChange={(v) => set('iterations', Number(v))}
        />
        <SelectField
          label="Output type"
          value={opts.encoding}
          options={[{ value: 'base64', label: 'Base64' }, { value: 'hex', label: 'Hexadecimal' }]}
          onChange={(v) => set('encoding', v)}
        />
        <div className="flex flex-wrap items-end gap-4 pb-2.5 lg:col-span-2">
          <CheckField
            label={aes ? 'Random IV (required for AES)' : 'Random IV generator'}
            checked={aes || opts.randomIv}
            disabled={aes}
            onChange={(v) => set('randomIv', v)}
          />
          <CheckField label="Wrap output in ENC(…)" checked={!!opts.wrapEnc} onChange={(v) => set('wrapEnc', v)} />
        </div>
      </div>
      <p className="-mt-4 text-xs text-dim">
        jasypt-spring-boot 3.x defaults: PBEWITHHMACSHA512ANDAES_256, 1000 iterations, random IV.
        Jasypt 1.9 / spring-boot 1.x–2.x default: PBEWithMD5AndDES with no IV.
      </p>
      <SplitTool toolId={tool.id} directions={directions} wrap inputPlaceholder="ENC(…) value to decrypt, or text to encrypt" />
    </main>
  );
}
