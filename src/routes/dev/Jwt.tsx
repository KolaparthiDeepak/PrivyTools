import { getTool } from '../../tools/registry';
import { ToolHeader } from '../../components/tool/ToolHeader';
import { JwtTool } from '../../components/dev/JwtTool';
import { decodeJwt } from '../../services/dev/jwt';

const tool = getTool('dev-jwt')!;

export default function Jwt() {
  return (
    <main role="main" className="mx-auto flex max-w-5xl flex-col gap-8 p-6 sm:p-10">
      <ToolHeader
        tool={tool}
        title="Decode a JWT."
        subtitle="Header, payload, and claims. Nothing leaves your device; the signature is not checked."
      />
      <JwtTool toolId={tool.id} decode={decodeJwt} />
    </main>
  );
}
