-- ============================================================
-- KIRAYA
-- Migration: bootstrap
--
-- Must run BEFORE 20260813000101.
--
-- Creates:
--   1. kiraya schema
--   2. required PostgreSQL extension
--   3. all enum types referenced by the schema
-- ============================================================


-- ------------------------------------------------------------
-- Schema / extensions
-- ------------------------------------------------------------

create schema if not exists kiraya;

create extension if not exists pgcrypto;


-- ------------------------------------------------------------
-- Identity / organization enums
-- ------------------------------------------------------------

create type kiraya.profile_status as enum (
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED'
);

create type kiraya.organization_status as enum (
    'ACTIVE',
    'SUSPENDED',
    'ARCHIVED'
);

create type kiraya.role_scope as enum (
    'PLATFORM',
    'ORGANIZATION'
);

create type kiraya.member_status as enum (
    'INVITED',
    'ACTIVE',
    'SUSPENDED',
    'REMOVED'
);


-- ------------------------------------------------------------
-- Property / ownership enums
-- ------------------------------------------------------------

create type kiraya.property_status as enum (
    'ACTIVE',
    'INACTIVE',
    'ARCHIVED'
);

create type kiraya.unit_status as enum (
    'VACANT',
    'OCCUPIED',
    'MAINTENANCE',
    'UNAVAILABLE'
);

create type kiraya.owner_type as enum (
    'INDIVIDUAL',
    'COMPANY',
    'TRUST',
    'OTHER'
);


-- ------------------------------------------------------------
-- Tenant / lease enums
-- ------------------------------------------------------------

create type kiraya.tenant_type as enum (
    'INDIVIDUAL',
    'COMPANY',
    'OTHER'
);

create type kiraya.tenant_status as enum (
    'ACTIVE',
    'INACTIVE',
    'ARCHIVED'
);

create type kiraya.lease_status as enum (
    'DRAFT',
    'ACTIVE',
    'ENDED',
    'CANCELLED'
);

create type kiraya.lease_party_role as enum (
    'CO_TENANT',
    'OCCUPANT',
    'GUARANTOR',
    'OTHER'
);


-- ------------------------------------------------------------
-- Billing enums
-- ------------------------------------------------------------

create type kiraya.billing_frequency as enum (
    'MONTHLY',
    'QUARTERLY',
    'YEARLY',
    'WEEKLY',
    'CUSTOM'
);

create type kiraya.proration_method as enum (
    'CALENDAR_DAYS',
    'FIXED_30_DAYS',
    'DATE_TO_DATE',
    'NONE'
);


-- ------------------------------------------------------------
-- Utility / meter enums
-- ------------------------------------------------------------

create type kiraya.meter_type as enum (
    'FIXED',
    'SUB_METER',
    'SELF_METER',
    'OTHER'
);

create type kiraya.reading_event_type as enum (
    'NORMAL',
    'METER_RESET',
    'METER_REPLACEMENT'
);

create type kiraya.reading_source as enum (
    'MANUAL',
    'IMPORT',
    'API',
    'OTHER'
);


-- ------------------------------------------------------------
-- Billing run / bill enums
-- ------------------------------------------------------------

create type kiraya.billing_run_status as enum (
    'DRAFT',
    'RUNNING',
    'COMPLETED',
    'PARTIAL',
    'FAILED',
    'FINALIZED'
);

create type kiraya.bill_status as enum (
    'DRAFT',
    'FINALIZED',
    'PARTIALLY_PAID',
    'PAID',
    'VOID'
);


-- ------------------------------------------------------------
-- Payment / ledger enums
-- ------------------------------------------------------------

create type kiraya.payment_method_type as enum (
    'CASH',
    'ONLINE',
    'DISCOUNT',
    'OTHER'
);

create type kiraya.payment_status as enum (
    'POSTED',
    'REVERSED'
);

create type kiraya.ledger_entry_type as enum (
    'BILL',
    'PAYMENT',
    'ADJUSTMENT',
    'CREDIT_APPLICATION',
    'REVERSAL',
    'ALLOCATION_REVERSAL',
    'EXIT_SETTLEMENT',
    'DEPOSIT_RECEIPT',
    'DEPOSIT_DEDUCTION',
    'DEPOSIT_REFUND'
);


-- ------------------------------------------------------------
-- Security deposit / exit enums
-- ------------------------------------------------------------

create type kiraya.deposit_status as enum (
    'PENDING',
    'PARTIALLY_RECEIVED',
    'RECEIVED'
);

create type kiraya.exit_status as enum (
    'INITIATED',
    'PENDING_SETTLEMENT',
    'COMPLETED',
    'CANCELLED'
);

create type kiraya.settlement_status as enum (
    'DRAFT',
    'FINALIZED',
    'SETTLED',
    'CANCELLED'
);


-- ------------------------------------------------------------
-- Documents / messaging / imports
-- ------------------------------------------------------------

create type kiraya.document_visibility as enum (
    'INTERNAL',
    'CLIENT',
    'TENANT',
    'SHARED'
);

create type kiraya.message_status as enum (
    'QUEUED',
    'SENT',
    'DELIVERED',
    'READ',
    'FAILED',
    'CANCELLED'
);

create type kiraya.import_status as enum (
    'UPLOADED',
    'PROCESSING',
    'COMPLETED',
    'PARTIAL',
    'FAILED',
    'CANCELLED'
);