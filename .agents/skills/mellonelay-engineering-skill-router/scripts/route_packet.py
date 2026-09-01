#!/usr/bin/env python3
"""Generate a compact worker packet template. No network or repo mutation."""
import argparse, json
p=argparse.ArgumentParser()
p.add_argument('--task-id', required=True)
p.add_argument('--workstream', required=True)
p.add_argument('--objective', required=True)
p.add_argument('--mode', choices=['read_only','modify'], default='read_only')
p.add_argument('--graph-question', default='')
p.add_argument('--graph-mode', choices=['bfs','dfs'], default='bfs')
p.add_argument('--graph-depth', type=int, default=3)
p.add_argument('--graph-token-budget', type=int, default=900)
a=p.parse_args()
packet={
 'task_id':a.task_id,'workstream':a.workstream,'objective':a.objective,'mode':a.mode,
 'known_verified_state':[],'invalidated_evidence':[],'unknowns':[],'forbidden_repeat':[],
 'graph_context':{'question':a.graph_question,'mode':a.graph_mode,'depth':a.graph_depth,'token_budget':a.graph_token_budget,'nodes_or_paths':[]},
 'owned_files_or_surfaces':[],'selected_skills':[],'acceptance_checks':[],
 'budgets':{'token_budget':None,'attempt_budget':None,'time_budget':None},
 'stop_when':'acceptance checks are proven','escalate_when':'scope/dependency conflict, missing authority, or blocked evidence'
}
print(json.dumps(packet, indent=2))
