import { useMemo, useState } from 'react';
import { Dices } from 'lucide-react';
import { getTool } from '../../tools/registry';
import { ToolHeader } from '../../components/tool/ToolHeader';
import { SplitTool, type Direction } from '../../components/dev/SplitTool';
import { SelectField, TextField } from '../../components/dev/OptionFields';
import {
  decryptText, encryptText, ivLen, modesFor, randomIvHex, randomKeyHex, CIPHER_ALGOS, type CipherOptions,
} from '../../services/dev/cipher';

const tool = getTool('dev-cipher')!;

function RandomButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" aria-label={label} title={label} className="text-dim hover:text-text" onClick={onClick}>
      <Dices className="size-3.5" />
    </button>
  );
}

export default function Cipher() {
  const [opts, setOpts] = useState<CipherOptions>({
    algo: 'AES-256',
    mode: 'CBC',
    encoding: 'base64',
    keySource: 'passphrase',
    passphrase: '',
    kdf: 'pbkdf2-sha256',
    iterations: 10000,
    keyHex: '',
    ivHex: '',
  });

  const update = (patch: Partial<CipherOptions>) =>
    setOpts((o) => {
      const next = { ...o, ...patch };
      const modes = modesFor(next.algo, next.keySource);
      return modes.includes(next.mode) ? next : { ...next, mode: modes[0] };
    });

  const directions = useMemo<Direction[]>(() => [
    {
      id: 'enc', label: 'Encrypt',
      transform: (s) => encryptText(s, opts),
      inputLanguage: 'text', outputLanguage: 'text',
      downloadName: 'encrypted.txt', downloadType: 'text/plain',
    },
    {
      id: 'dec', label: 'Decrypt',
      transform: (s) => decryptText(s, opts),
      inputLanguage: 'text', outputLanguage: 'text',
      downloadName: 'decrypted.txt', downloadType: 'text/plain',
    },
  ], [opts]);

  const raw = opts.keySource === 'raw';
  const needsIv = ivLen(opts) > 0;

  return (
    <main role="main" className="mx-auto flex max-w-5xl flex-col gap-8 p-6 sm:p-10">
      <ToolHeader
        tool={tool}
        title="AES and DES encrypt and decrypt."
        subtitle="OpenSSL / CryptoJS passphrase format, or your own key and IV. Keys never leave your device."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SelectField
          label="Key source"
          value={opts.keySource}
          options={[{ value: 'passphrase', label: 'Passphrase (OpenSSL)' }, { value: 'raw', label: 'Raw key + IV (hex)' }]}
          onChange={(v) => update({ keySource: v })}
        />
        <SelectField label="Algorithm" value={opts.algo} options={CIPHER_ALGOS} onChange={(v) => update({ algo: v })} />
        <SelectField label="Mode" value={opts.mode} options={modesFor(opts.algo, opts.keySource)} onChange={(v) => update({ mode: v })} />
        <SelectField
          label="Ciphertext encoding"
          value={opts.encoding}
          options={[{ value: 'base64', label: 'Base64' }, { value: 'hex', label: 'Hex' }]}
          onChange={(v) => update({ encoding: v })}
        />
        {raw ? (
          <>
            <TextField
              label="Key (hex)"
              secret
              value={opts.keyHex}
              onChange={(v) => update({ keyHex: v })}
              placeholder="000102…"
              className="lg:col-span-2"
              trailing={<RandomButton label="Random key" onClick={() => update({ keyHex: randomKeyHex(opts.algo) })} />}
            />
            <TextField
              label={opts.mode === 'GCM' ? 'Nonce / IV (hex, 12 bytes typical)' : 'IV (hex)'}
              value={needsIv ? opts.ivHex : ''}
              disabled={!needsIv}
              onChange={(v) => update({ ivHex: v })}
              placeholder={needsIv ? `${ivLen(opts) * 2} hex chars` : 'ECB uses no IV'}
              className="lg:col-span-2"
              trailing={needsIv && <RandomButton label="Random IV" onClick={() => update({ ivHex: randomIvHex(opts) })} />}
            />
          </>
        ) : (
          <>
            <TextField
              label="Passphrase"
              secret
              value={opts.passphrase}
              onChange={(v) => update({ passphrase: v })}
              className="lg:col-span-2"
            />
            <SelectField
              label="Key derivation"
              value={opts.kdf}
              options={[
                { value: 'pbkdf2-sha256', label: 'PBKDF2-SHA256 (-pbkdf2)' },
                { value: 'pbkdf2-sha512', label: 'PBKDF2-SHA512 (-pbkdf2 -md sha512)' },
                { value: 'evp-md5', label: 'EVP MD5 (legacy / CryptoJS)' },
              ]}
              onChange={(v) => update({ kdf: v })}
            />
            <TextField
              label="Iterations"
              type="number"
              min={1}
              value={String(opts.iterations)}
              disabled={opts.kdf === 'evp-md5'}
              onChange={(v) => update({ iterations: Number(v) })}
            />
          </>
        )}
      </div>
      <SplitTool toolId={tool.id} directions={directions} wrap inputPlaceholder="text to encrypt, or ciphertext to decrypt" />
    </main>
  );
}
