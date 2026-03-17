import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Database, Shield, Link2, ChevronDown, ChevronRight } from "lucide-react";

const SCHEMA = [
  {
    name: "User (Built-in)",
    table: "users",
    description: "Built-in Base44 entity. Stores id, email, full_name, role, created_date automatically.",
    note: "Extended by UserProfile for all business-specific fields.",
    fields: [
      { name: "id", type: "UUID", note: "auto" },
      { name: "email", type: "string", note: "auto, unique" },
      { name: "full_name", type: "string", note: "auto" },
      { name: "role", type: "enum", note: "admin / user" },
    ],
  },
  {
    name: "UserProfile",
    table: "user_profiles + users extended",
    description: "Combines SQL tables 1 (users) and 2 (user_profiles). Stores all business, personal, and banking data for the user.",
    fields: [
      { name: "user_id", type: "string", note: "Reference to User" },
      { name: "first_name", type: "string" },
      { name: "last_name", type: "string" },
      { name: "phone_il", type: "string", note: "Israeli phone" },
      { name: "id_number_il", type: "string", note: "🔒 ENCRYPTED — ת\"ז" },
      { name: "business_type", type: "enum", note: "freelancer / retail / studio / food / consultant / other" },
      { name: "business_name", type: "string" },
      { name: "onboarding_step", type: "number", note: "0-based" },
      { name: "plan", type: "enum", note: "free / starter / pro / business" },
      { name: "is_active", type: "boolean", note: "default: true" },
      { name: "date_of_birth", type: "date" },
      { name: "address", type: "string" },
      { name: "city", type: "string" },
      { name: "bank_name", type: "string" },
      { name: "bank_branch", type: "string" },
      { name: "bank_account", type: "string", note: "🔒 ENCRYPTED" },
      { name: "vat_number", type: "string", note: "מספר עוסק" },
      { name: "tax_file_number", type: "string" },
      { name: "nii_number", type: "string", note: "ביטוח לאומי" },
      { name: "family_data", type: "array", note: "[{name, dob, relation}]" },
    ],
  },
  {
    name: "Document",
    table: "documents",
    description: "Uploaded files: contracts, invoices, licenses, receipts, forms. Linked to signatures and AI legal confidence scores.",
    fields: [
      { name: "user_id", type: "string", note: "Owner ref" },
      { name: "file_name", type: "string", note: "REQUIRED" },
      { name: "file_type", type: "enum", note: "pdf / docx / jpg / png" },
      { name: "file_size_kb", type: "number" },
      { name: "storage_path", type: "string", note: "File URL" },
      { name: "category", type: "enum", note: "contract / invoice / license / receipt / form" },
      { name: "is_signed", type: "boolean", note: "default: false" },
      { name: "signature_id", type: "string", note: "→ Signature.id" },
      { name: "legal_check_confidence", type: "number", note: "0.00–100.00" },
      { name: "status", type: "enum", note: "active / archived / deleted" },
    ],
  },
  {
    name: "Signature",
    table: "signatures",
    description: "User's stored signatures (drawn, uploaded, or typed). One active signature per user.",
    fields: [
      { name: "user_id", type: "string", note: "Owner ref" },
      { name: "type", type: "enum", note: "drawn / uploaded / typed" },
      { name: "storage_path", type: "string", note: "File URL" },
      { name: "is_active", type: "boolean", note: "default: true" },
    ],
  },
  {
    name: "Contact",
    table: "contacts",
    description: "Personal and professional contacts: family, advisors, lawyers, investors, clients, bankers, colleagues, suppliers.",
    fields: [
      { name: "user_id", type: "string", note: "Owner ref" },
      { name: "category", type: "enum", note: "family / advisor / lawyer / investor / client / banker / colleague / supplier" },
      { name: "full_name", type: "string", note: "REQUIRED" },
      { name: "profession", type: "string" },
      { name: "responsibility", type: "string" },
      { name: "phone", type: "string" },
      { name: "email", type: "string" },
      { name: "website", type: "string" },
      { name: "availability", type: "string" },
      { name: "notes", type: "string" },
    ],
  },
  {
    name: "Client",
    table: "clients",
    description: "Business clients, optionally linked to a Contact record.",
    fields: [
      { name: "user_id", type: "string", note: "Owner ref" },
      { name: "contact_id", type: "string", note: "→ Contact.id (optional)" },
      { name: "full_name", type: "string", note: "REQUIRED" },
      { name: "phone", type: "string" },
      { name: "email", type: "string" },
      { name: "notes", type: "string" },
    ],
  },
  {
    name: "BusinessOpeningStep",
    table: "business_opening_steps",
    description: "Tracks progress through government registration steps: VAT, tax file, NII, bank account, business license.",
    fields: [
      { name: "user_id", type: "string", note: "Owner ref" },
      { name: "step_key", type: "enum", note: "vat_file / tax_file / nii / bank_account / license" },
      { name: "status", type: "enum", note: "not_started / in_progress / submitted / completed / manual_fallback / queued" },
      { name: "agent_log", type: "array", note: "[{timestamp, action, result}]" },
      { name: "draft_data", type: "object", note: "Form draft JSONB" },
      { name: "submission_screenshot", type: "string", note: "Screenshot URL" },
      { name: "submitted_at", type: "datetime" },
    ],
  },
  {
    name: "Order",
    table: "orders",
    description: "Tracked deliveries and orders parsed from email or entered manually.",
    fields: [
      { name: "user_id", type: "string", note: "Owner ref" },
      { name: "source_email_id", type: "string" },
      { name: "carrier", type: "string" },
      { name: "order_number", type: "string" },
      { name: "contents", type: "string" },
      { name: "expected_date", type: "date" },
      { name: "delivery_days", type: "number" },
      { name: "status", type: "enum", note: "pending / in_transit / delivered / delayed" },
      { name: "notes", type: "string" },
    ],
  },
  {
    name: "ScheduleEvent",
    table: "schedule_events",
    description: "Calendar events from multiple sources: manual entry, clients, orders, milestones, notifications.",
    fields: [
      { name: "user_id", type: "string", note: "Owner ref" },
      { name: "title", type: "string", note: "REQUIRED" },
      { name: "category", type: "enum", note: "client / delivery / order / milestone / government / personal" },
      { name: "start_time", type: "datetime" },
      { name: "end_time", type: "datetime" },
      { name: "all_day", type: "boolean", note: "default: false" },
      { name: "source_type", type: "enum", note: "manual / client / order / milestone / notification" },
      { name: "source_id", type: "string", note: "Source record ID" },
      { name: "notes", type: "string" },
    ],
  },
  {
    name: "Milestone",
    table: "milestones",
    description: "Vision → Goal → Task hierarchy. Self-referential via parent_id. Supports SMART goal tagging.",
    fields: [
      { name: "user_id", type: "string", note: "Owner ref" },
      { name: "type", type: "enum", note: "vision / goal / task" },
      { name: "parent_id", type: "string", note: "→ Milestone.id (self-ref)" },
      { name: "title", type: "string", note: "REQUIRED" },
      { name: "description", type: "string" },
      { name: "due_date", type: "date" },
      { name: "is_smart", type: "boolean", note: "default: false" },
      { name: "status", type: "enum", note: "active / completed / skipped" },
      { name: "schedule_event_id", type: "string", note: "→ ScheduleEvent.id" },
      { name: "completed_at", type: "datetime" },
    ],
  },
  {
    name: "Notification",
    table: "notifications",
    description: "Multi-tier notification system: personal reminders, national holidays, system alerts.",
    fields: [
      { name: "user_id", type: "string", note: "Target user" },
      { name: "tier", type: "enum", note: "personal / national / system" },
      { name: "type", type: "enum", note: "birthday / holiday / doc_expiry / deadline / delivery_delay / milestone_due" },
      { name: "title", type: "string" },
      { name: "body", type: "string" },
      { name: "is_read", type: "boolean", note: "default: false" },
      { name: "action_url", type: "string" },
      { name: "scheduled_for", type: "datetime" },
      { name: "sent_at", type: "datetime" },
    ],
  },
  {
    name: "Payment",
    table: "payments",
    description: "Micro-payment records for premium features: templates, storage, email signatures, domains, automations, AI queries.",
    fields: [
      { name: "user_id", type: "string", note: "Paying user" },
      { name: "feature_key", type: "enum", note: "template_download / storage / email_sig / domain / automation / ai_query" },
      { name: "amount_ils", type: "number", note: "Amount in ₪" },
      { name: "currency", type: "string", note: "default: ILS" },
      { name: "status", type: "enum", note: "pending / completed / failed / refunded" },
      { name: "gateway_ref", type: "string", note: "Payment gateway reference" },
    ],
  },
];

const RELATIONSHIPS = [
  { from: "UserProfile", to: "User (built-in)", field: "user_id", type: "1:1" },
  { from: "Document", to: "UserProfile", field: "user_id", type: "N:1" },
  { from: "Document", to: "Signature", field: "signature_id", type: "N:1" },
  { from: "Signature", to: "UserProfile", field: "user_id", type: "N:1" },
  { from: "Contact", to: "UserProfile", field: "user_id", type: "N:1" },
  { from: "Client", to: "UserProfile", field: "user_id", type: "N:1" },
  { from: "Client", to: "Contact", field: "contact_id", type: "N:1 (optional)" },
  { from: "BusinessOpeningStep", to: "UserProfile", field: "user_id", type: "N:1" },
  { from: "Order", to: "UserProfile", field: "user_id", type: "N:1" },
  { from: "ScheduleEvent", to: "UserProfile", field: "user_id", type: "N:1" },
  { from: "Milestone", to: "UserProfile", field: "user_id", type: "N:1" },
  { from: "Milestone", to: "Milestone", field: "parent_id", type: "Self-ref (N:1)" },
  { from: "Notification", to: "UserProfile", field: "user_id", type: "N:1" },
  { from: "Payment", to: "UserProfile", field: "user_id", type: "N:1" },
];

function EntityCard({ entity }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="border border-slate-200 hover:border-slate-300 transition-colors">
      <CardHeader
        className="cursor-pointer select-none py-4 px-5"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
            <CardTitle className="text-base font-semibold text-slate-900">
              {entity.name}
            </CardTitle>
            <Badge variant="outline" className="text-xs font-mono text-slate-500">
              {entity.table}
            </Badge>
          </div>
          <span className="text-xs text-slate-400">{entity.fields.length} fields</span>
        </div>
        <p className="text-sm text-slate-500 mt-1 ml-7">{entity.description}</p>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-0 px-5 pb-5">
          {entity.note && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded px-3 py-2 mb-3">
              {entity.note}
            </p>
          )}
          <div className="rounded-lg border border-slate-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-4 py-2 font-medium text-slate-600">Field</th>
                  <th className="px-4 py-2 font-medium text-slate-600">Type</th>
                  <th className="px-4 py-2 font-medium text-slate-600">Notes</th>
                </tr>
              </thead>
              <tbody>
                {entity.fields.map((f, i) => (
                  <tr key={f.name} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                    <td className="px-4 py-2 font-mono text-xs text-slate-800">{f.name}</td>
                    <td className="px-4 py-2">
                      <Badge variant="secondary" className="text-xs font-mono">
                        {f.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-500">{f.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function SchemaDocumentation() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-slate-900">
              <Database className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Fresh Start — Database Schema
            </h1>
          </div>
          <p className="text-slate-500 text-sm mt-2 max-w-2xl">
            Sprint 1 of 23. Complete entity schema for the Fresh Start platform.
            12 tables mapped to 11 custom entities + 1 built-in User entity.
          </p>
        </div>

        {/* Security Notice */}
        <Card className="mb-8 border-amber-200 bg-amber-50/50">
          <CardContent className="py-4 px-5">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-amber-800 mb-1">Security & Encryption</h3>
                <ul className="text-xs text-amber-700 space-y-1">
                  <li>• <code className="bg-amber-100 px-1 rounded">id_number_il</code> (ת"ז) — stored AES-256-GCM encrypted at rest</li>
                  <li>• <code className="bg-amber-100 px-1 rounded">bank_account</code> — stored encrypted at rest</li>
                  <li>• Raw values of these fields must never be logged</li>
                  <li>• Indexed fields: user email (unique), documents.user_id, contacts.user_id, notifications.user_id</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Entity Cards */}
        <div className="space-y-3 mb-10">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Entities ({SCHEMA.length})
          </h2>
          {SCHEMA.map((entity) => (
            <EntityCard key={entity.name} entity={entity} />
          ))}
        </div>

        <Separator className="my-8" />

        {/* Relationships */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Link2 className="w-4 h-4 text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-800">Relationships</h2>
          </div>
          <div className="rounded-lg border border-slate-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-4 py-2 font-medium text-slate-600">From</th>
                  <th className="px-4 py-2 font-medium text-slate-600">To</th>
                  <th className="px-4 py-2 font-medium text-slate-600">Via Field</th>
                  <th className="px-4 py-2 font-medium text-slate-600">Cardinality</th>
                </tr>
              </thead>
              <tbody>
                {RELATIONSHIPS.map((r, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                    <td className="px-4 py-2 font-mono text-xs">{r.from}</td>
                    <td className="px-4 py-2 font-mono text-xs">{r.to}</td>
                    <td className="px-4 py-2 font-mono text-xs text-slate-500">{r.field}</td>
                    <td className="px-4 py-2">
                      <Badge variant="outline" className="text-xs">{r.type}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mapping Notes */}
        <Card className="border-slate-200">
          <CardContent className="py-4 px-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-2">SQL → Base44 Mapping Notes</h3>
            <ul className="text-xs text-slate-600 space-y-1.5">
              <li>• SQL tables <code className="bg-slate-100 px-1 rounded">users</code> + <code className="bg-slate-100 px-1 rounded">user_profiles</code> → Built-in <code className="bg-slate-100 px-1 rounded">User</code> entity + custom <code className="bg-slate-100 px-1 rounded">UserProfile</code> entity</li>
              <li>• Built-in fields (id, created_date, updated_date, created_by) are auto-generated — not duplicated in schemas</li>
              <li>• Foreign keys are stored as string IDs referencing other entity record IDs</li>
              <li>• JSONB columns mapped to <code className="bg-slate-100 px-1 rounded">array</code> or <code className="bg-slate-100 px-1 rounded">object</code> types</li>
              <li>• <code className="bg-slate-100 px-1 rounded">ON DELETE CASCADE</code> behavior must be handled in application logic</li>
              <li>• Indexes are managed by the Base44 platform automatically</li>
            </ul>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400 mt-8">
          Fresh Start Platform • Sprint 1/23 • Schema v1.0
        </p>
      </div>
    </div>
  );
}