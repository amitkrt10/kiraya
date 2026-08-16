-- ============================================================
-- KIRAYA
-- P1.9: exit settlement ledger linkage
-- ============================================================


alter table kiraya.ledger_entries
add column if not exists exit_settlement_id uuid
    references kiraya.exit_settlements(id)
    on delete restrict;


create index if not exists ledger_entries_exit_settlement_idx
    on kiraya.ledger_entries (
        exit_settlement_id
    );


comment on column kiraya.ledger_entries.exit_settlement_id is
    'Exit settlement associated with this financial ledger entry.';