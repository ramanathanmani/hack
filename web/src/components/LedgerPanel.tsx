import type { Checkpoint, CheckpointKind } from "@shared/types";

const KIND_LABEL: Record<CheckpointKind, string> = {
  genesis: "Genesis",
  answer_save: "Answer Saved",
  freeze: "Session Frozen",
  resume: "Session Resumed",
  submit: "Submitted",
};

function shortHash(hash: string): string {
  return hash.length > 12 ? `${hash.slice(0, 8)}…${hash.slice(-4)}` : hash;
}

export function LedgerPanel({ checkpoints }: { checkpoints: Checkpoint[] }) {
  return (
    <div className="panel">
      <p className="panel__header">Checkpoint Ledger</p>
      {checkpoints.length === 0 ? (
        <p className="panel__empty">No checkpoints yet.</p>
      ) : (
        <table className="ledger-table">
          <caption className="visually-hidden">
            Live-appending checkpoint ledger, newest first
          </caption>
          <thead>
            <tr>
              <th scope="col">Seq</th>
              <th scope="col">Kind</th>
              <th scope="col">Hash</th>
              <th scope="col">Prev Hash</th>
            </tr>
          </thead>
          <tbody>
            {checkpoints.map((cp) => (
              <tr key={cp.id}>
                <td>{cp.seq}</td>
                <td>{KIND_LABEL[cp.kind]}</td>
                <td className="hash-cell mono" title={cp.hash}>
                  {shortHash(cp.hash)}
                </td>
                <td className="hash-cell mono" title={cp.prevHash}>
                  {shortHash(cp.prevHash)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
