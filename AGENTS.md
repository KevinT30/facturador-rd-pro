<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Catalog maintenance pages share `src/components/crud-page.tsx` (config-driven table+modal); add new catalogs by config, not new CRUD code. Why: consistent search/pagination/status behavior.
- Records are never deleted (no DELETE grant/policy); status via `activo`. Why: preserve historical invoices.
- Roles live in `public.user_roles` checked with `has_role()`; catalog writes are admin-only via RLS. First signup becomes admin in `handle_new_user` trigger.
