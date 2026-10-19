# NEXI dated receipt chronology — 2026-10-19

This is a read-and-hash inventory. A receipt marked VERIFIED is not automatically a current runtime proof. Dates are embedded timestamps where present, otherwise UTC file mtime. No credentials are copied.

## Reconciled chronology

- 2026-10-03 to 05: Public build, Git, deploy, browser and indicator phase receipts; historical frontend scope, not current VPS backend acceptance.
- 2026-10-07 to 12: Cloudflare-era backend transition/recovery receipts; historical architecture, not current SQLite authority.
- 2026-10-16 to 17: VPS SQLite binding, SIWE authenticated reads, private deposit-proof storage, isolated BullMQ retry and MOEX provider runtime checks; scoped proof reused.
- 2026-10-17 to 18: local SQLite finance regression 18/18, focused Margin 13/13; local tests are not live financial acceptance.
- 2026-10-18 10:48 UTC: acceptance-result.json reports transfer HTTP 201, idempotent replay HTTP 201 and readbacks 200; no independent economic-group conservation proof.
- 2026-10-18 11:39 UTC: remaining-acceptance.json reports 3 failures/5 blocked; superseded or narrowed by later A/B and fixes.
- 2026-10-18 11:50 UTC: final-acceptance.json (A) 22 PASS/1 FAIL/6 BLOCKED; fullyAccepted=false.
- 2026-10-18 12:19 UTC: closure-report.json (B) 6 PASS/1 FAIL/5 remaining; overlaps A and cannot be added to A.
- 2026-10-18 18:46 UTC: broad Jest 108 passed/5 failed suites; 577 passed/13 failed tests (113 suites/590 tests). Historical FAILED run, not full-suite green.
- 2026-10-18 20:54 UTC: six targeted changed-contract suites, 33/33 PASS.
- 2026-10-19 04:38 UTC: Binary 22/22 and Mining 7/7 targeted tests PASS; NestJS Doctor 87/100, 334 classified findings, zero error severity. Not all findings fixed.
- 2026-10-19 05:35 UTC: authenticated four-lifecycle HTTP run 20 PASS/0 FAIL/4 BLOCKED; fullyAccepted=false. Public/Admin login, Binary and Mining selected operations succeeded.
- 2026-10-19 05:38 UTC: current owner decision at commit 2f933cb closes four remaining work requirements as OWNER_ACCEPTED_UNTESTED, NOT test-passed.

## Proof boundary

Four owner-accepted but untested gates: Mining economic maturity/redeem; Loan genuine collateral and Admin lifecycle; Withdrawal security/destination/Admin settlement; per-economic-group Ledger/Activity/EventOutbox equality. Source/runtime readiness is distinct from these gates. Older Cloudflare/D1 receipts do not override current VPS SQLite authority. No live test, migration, service restart or deployment occurred in this reconciliation.

## Phase receipt archive — full parsed JSON and SHA-256

| UTC date | Filename | Phase | Outcome | SHA256 prefix |
|---|---|---|---|---|
| 2026-10-02T21:56:04 | kernel-focused-tests.json | other | UNSPECIFIED | a698236035dd6634 |
| 2026-10-02T21:56:05 | 4f47e6a81114abe1fbd860048e7e1f982fc4c2aecd5e1f0565589814c501ca4a.json | implementation | VERIFIED | 48fd118e8be25a31 |
| 2026-10-02T21:56:05 | kernel-wrapper-integration.json | other | UNSPECIFIED | a52e007d82baa1e8 |
| 2026-10-02T21:56:46 | 13f108a9c15692994326655ecbf6292a1445976bd677bfb09f623fa92a95975a.json | test | VERIFIED | b4d91893dcd685d9 |
| 2026-10-02T21:59:17 | a3c8c80e07140d9d0fa8e88c4ea59d477d5a42b9a5e3baed0b5600063d231ddd.json | review | VERIFIED | ed26eaad38720ae0 |
| 2026-10-02T22:03:01 | dfe667226e41692edb89391984c71f94f02d2128ade9c51e3534eeeacb8ea838.json | git | VERIFIED | 08ffda6275a002e8 |
| 2026-10-02T22:03:01 | kernel-transition-input.json | completion | VERIFIED | 397633d891c92d91 |
| 2026-10-02T22:03:02 | 7ac835fb0af28d8eca13de38d1d38b030c8bb7922b9f2630f8cc51d4a2a18a3c.json | completion | VERIFIED | cbf77f4de50350b8 |
| 2026-10-03T05:05:04 | public-recovery-20261003.json | completion | VERIFIED | 08133629540b15ae |
| 2026-10-03T05:05:05 | 50f7cf74ffab7c73aaed2dde4d13f854aef0a1bad5bc0cd117ba61cc87636ab9.json | completion | VERIFIED | ca9ccc0cc5efdc39 |
| 2026-10-03T07:50:21 | public-implementation-20261003.json | implementation | VERIFIED | 08f6bc56b6d9a429 |
| 2026-10-03T07:50:41 | 7c9f7575efbf40414ef8038e6b91b63cd744a1d76ba5cbbb969c851a10cba785.json | implementation | VERIFIED | 94a431962da8bd7d |
| 2026-10-03T07:58:54 | public-build-20261003.json | test | VERIFIED | d2bfb4f8da08e3bf |
| 2026-10-03T07:58:55 | 20a5cf4f4a778fb0f90a64bec8de1cce3666b5cc468ac585d7c35b14c40e4271.json | test | VERIFIED | a689b063d3c2f376 |
| 2026-10-03T07:59:41 | public-git-20261003.json | git | VERIFIED | 3471a3397dc283fe |
| 2026-10-03T07:59:43 | 094e2f662b65a56933827282f16e4a49f67efd45a03617f42007b98dd3220d84.json | git | VERIFIED | a39927d45b9126f2 |
| 2026-10-03T08:01:58 | public-deploy-20261003.json | deploy | VERIFIED | 69a0363d652b0eca |
| 2026-10-03T08:01:59 | 49afab8bbec58127320f8ee7544fa2bec4fc2c6c2ab8cded94384da414ec2e74.json | deploy | VERIFIED | c94d878c0a80ba95 |
| 2026-10-03T08:11:21 | public-browser-reroute-20261003.json | browser | BLOCKED_WITH_EVIDENCE | e15973cb946f884f |
| 2026-10-03T08:11:22 | dd5bacfd976ad6fd3c2ff5814130104d30427a64973c0960ac5f4b323b8c270d.json | browser | BLOCKED_WITH_EVIDENCE | 9c40d83806c581ee |
| 2026-10-03T08:19:53 | public-legend-implementation-20261003.json | implementation | VERIFIED | c00b1e03f64384da |
| 2026-10-03T08:19:53 | 9823102bd9219ad26ad7eeb0ea3dc1b27e82651357ae2d2ab259f73596a768d0.json | implementation | VERIFIED | 6924dac2f76e3e3c |
| 2026-10-03T10:42:20 | 5f226a812d7b565b5e6e385680af9e0766fb7b082e5650cf7d94a3d341ab2415.json | test | VERIFIED | 0a86342dad8e4efd |
| 2026-10-03T10:43:01 | db56ef541571ffbe3d5755de6b9b5d1be0dbb1ffd0e64822e2852cfeccf33f5b.json | git | VERIFIED | f42b0141fad55c5e |
| 2026-10-03T10:46:38 | 3e532a8e3d63e86cb2234f706c02e00bab3f2b797bb062c171e7fcaba9500de1.json | deploy | VERIFIED | e998f5e4944457ce |
| 2026-10-03T14:54:54 | 4aa31c0cbe0d4bf241796793228151d0b2b7068bc9d45d599422b9816e077f64.json | browser | BLOCKED_WITH_EVIDENCE | a8a8c3662392832e |
| 2026-10-03T15:04:41 | 48e3863b6f3e53dbdf211d060d856c6bef04f5c85098eff07809ea04fe95600a.json | implementation | BLOCKED_WITH_EVIDENCE | 2ab6b13ae82e7adb |
| 2026-10-03T15:05:24 | fa958f2a1b0cbdb76b34d4e8e77779488f4b6e346463400c030f62c184077b61.json | completion | BLOCKED_WITH_EVIDENCE | 487279b7ba5e1260 |
| 2026-10-03T17:54:51 | 95d488ba493ea209ed14e03cbecd76178e05a8acb5078877518552e2710c81cd.json | completion | BLOCKED_WITH_EVIDENCE | 717fca8fa4b8ad21 |
| 2026-10-03T17:55:20 | aece76604698093af522f979064edd570e0a8a5a5009c9262f5d78ed33e2936b.json | diagnosis | VERIFIED | b46accfcb7f2feee |
| 2026-10-03T18:00:18 | 9bfcb6d81db5bbf8047074a8123f1a446b2fbc3ad35e3f03b5bba2185eebe640.json | implementation | BLOCKED_WITH_EVIDENCE | 10ca12796da25064 |
| 2026-10-03T18:01:32 | 46b4df2b1698823e18f856289a7791b695c4eb80ad35e0746b5ab5d03be0d8c2.json | completion | BLOCKED_WITH_EVIDENCE | 18c0b1d01b3de427 |
| 2026-10-03T18:28:48 | 195411d68878efade7b74ed7f30a232484a407c2326979300a5394c57e54dad4.json | completion | BLOCKED_WITH_EVIDENCE | 87e7d91c08251dda |
| 2026-10-03T18:34:21 | 56e15fc6aa13a540c66fcf4193d98db68c3d9822ae7e419d7abd3e6a4f6a7a9c.json | implementation | VERIFIED | dbb6fe00c69cbcba |
| 2026-10-03T18:40:15 | a46f2f55293dd7dff17381ad0ea88c6c253d2e38860fa539bfd3fd79045378aa.json | test | VERIFIED | bf4b58f546b5b0d3 |
| 2026-10-03T18:40:15 | 400f85940ac42a33a8a1a35fb1fa948e8edd69aaf33e793f591c7b0cbe1d7155.json | review | VERIFIED | e10eea5e8fd24d27 |
| 2026-10-03T18:41:34 | aa9ad298c077e3e7251e11061ef2c2fd2bfd7d30071527a173f8907cdeb6e2db.json | git | VERIFIED | 9da796eb104f669e |
| 2026-10-03T18:43:38 | 500d8486f2c35dea80ded0ca06ad6e77fdaad6bbe6e6a27b830ed4af542e2913.json | deploy | VERIFIED | a6bfcd7917272c83 |
| 2026-10-03T19:17:29 | c63d4b46d448ad2b8574fc557e0af64ecffa1175702679f4ed6b4e3e0c633f73.json | browser | VERIFIED | 552009ba45ecbe2c |
| 2026-10-03T19:18:08 | e8ecfa5ff263c01895de89351bc977087f1294b765bc43804b872fc3a54cbafc.json | browser | VERIFIED | d2b3df511cca66c5 |
| 2026-10-03T19:18:29 | p04-browser-final-20261004.json | browser | VERIFIED | c06e53d1f3065729 |
| 2026-10-03T19:18:30 | 44c88c3a700f6ad63751b0963f54406df3ade72e1fb16af81f5447f1c3fe5ace.json | browser | VERIFIED | adc3b08621da75af |
| 2026-10-03T19:18:39 | 8b0e7755862ac5509d2fe28d6ea5e19f26a43ee740fddc67c5810a8f2b33c597.json | browser | VERIFIED | 8b6e36b637ded4e7 |
| 2026-10-03T19:19:03 | p04-completion-final-20261004.json | completion | VERIFIED | 864682c02378ee15 |
| 2026-10-03T19:19:03 | 920975bfc448b68e3621b6fe544f72b771d23ff648d93a41ff0d7f81815b5374.json | completion | VERIFIED | 289de4d274f5ab8b |
| 2026-10-03T19:36:27 | 3def98cdb0afb5628b8216095104e49cd4801c112455d53f9e0b7be80844850a.json | completion | VERIFIED | 875564d17b5b84a1 |
| 2026-10-03T19:43:41 | p04-browser-isolation-20261004.json | browser | VERIFIED | 6c4b470aa58f9f97 |
| 2026-10-03T19:43:41 | 21809ab6f597f48065944ff8b5dc64037ea9191a0043c3797b16ef68cc27834f.json | browser | VERIFIED | 0a7bd414575f5cf7 |
| 2026-10-03T19:43:56 | p04-completion-isolation-20261004.json | completion | VERIFIED | e7267da0ceff79b0 |
| 2026-10-03T19:43:56 | 1d4b7d78db435ca48adf27cc6d70c987d25233eb177a089ce5d65660fbc2fbf8.json | completion | VERIFIED | dbe8d35d1d9f238f |
| 2026-10-04T13:30:03 | 88f8fcfbf2581e121bb6b7e6cdb39554f4b76f06c4487a112d509351d4330740.json | completion | VERIFIED | dc4369de3d10efbe |
| 2026-10-04T13:32:32 | destination-recovery-20261004.input.json | recovery | VERIFIED | aaccc9370dc134fd |
| 2026-10-04T13:32:32 | 8c674e4522ead0f5aaf8c5499f80ecda91bb1b18d9aa59f0b8c3e72c8a9de0f5.json | recovery | VERIFIED | e323357e050f87da |
| 2026-10-04T13:55:16 | p03-binary-configuration-read-20261004.json | other | UNSPECIFIED | 5b17c1f09af65113 |
| 2026-10-04T13:55:16 | destination-browser-20261004.input.json | browser | BLOCKED_WITH_EVIDENCE | 9ffb022c7b88a650 |
| 2026-10-04T13:55:32 | 50032d0c481f4f0bee617514849c8413cc6b39cee2e09025b2238b504260eef3.json | browser | BLOCKED_WITH_EVIDENCE | b801eb3e291f3d17 |
| 2026-10-04T13:56:10 | destination-completion-20261004.input.json | completion | BLOCKED_WITH_EVIDENCE | 73ce6e013f7bda93 |
| 2026-10-04T13:56:10 | 2e9ba1d25220206820567af1de9968a7d950597ebeee3c5a2f2944a660d298cd.json | completion | BLOCKED_WITH_EVIDENCE | 5e9081d01344dd8f |
| 2026-10-05T00:33:03 | recovered-maintenance-closeout-20261005.json | planning | VERIFIED | 66899e017c51105d |
| 2026-10-05T00:33:03 | f6c5a6712a5b2559551c7c7f42d8f9a60ede9d00f0fc7c5096095f85afffafd0.json | planning | VERIFIED | 5dbe55cc8f68eb5c |
| 2026-10-05T00:30Z | live-public-reconciliation-20261005.json | other | UNSPECIFIED | efcddfdb7d8ea95f |
| 2026-10-05T00:34:44 | public-recovery-phase-20261005.json | recovery | VERIFIED | 2e7e51c257b6a012 |
| 2026-10-05T00:34:44 | 137710cb22371458da822524882356c682ae5c52802c8a98d98eb2536ca9fcbc.json | recovery | VERIFIED | ae56df9175263132 |
| 2026-10-05T00:36:40 | public-bounded-closeout-20261005.json | completion | BLOCKED_WITH_EVIDENCE | 464cb5de3a432a8f |
| 2026-10-05T00:36:40 | 3425d283ee1c912227a05e8002bb9f77a1c12b55996112b8656b46b6c597dcce.json | completion | BLOCKED_WITH_EVIDENCE | 6c04f9d145a942de |
| 2026-10-05T04:32:10 | spot-indicators-source-verification-20261005.json | other | UNSPECIFIED | a0715024a6a4aed5 |
| 2026-10-05T04:32:53 | spot-indicators-implementation-closeout-input-20261005.json | implementation | VERIFIED | ba942d07b8718b5d |
| 2026-10-05T04:33:07 | c8aba37bd328e4c73964f2fb4b378e4cc998a59247c0e529fdeff72c2ff24bf4.json | implementation | VERIFIED | 156e3b8f6dc13b36 |
| 2026-10-05T04:33:40 | spot-indicators-browser-blocker-input-20261005.json | browser | BLOCKED_WITH_EVIDENCE | 7d0da323863bf842 |
| 2026-10-05T04:33:50 | fbb9ae7802ad4c5460d3fd7465e2162389ffe842c8a3a42ea2c3650934ed8cce.json | browser | BLOCKED_WITH_EVIDENCE | 80b4f18930f8ec71 |
| 2026-10-05T04:35:27 | spot-indicators-completion-closeout-input-20261005.json | completion | BLOCKED_WITH_EVIDENCE | dedb6b9561cf5106 |
| 2026-10-05T04:35:37 | 87ce5ab0aaf481487631435d7ebc3baadc94524c0ab82c7e0032c2cce49f99e3.json | completion | BLOCKED_WITH_EVIDENCE | 096a1600f23d3beb |
| 2026-10-06T02:57:21 | cc9481705cfbb8fea8ccee69ca95f2078df5f7d463a6a38eca8d45b1ef97092b.json | recovery | BLOCKED_WITH_EVIDENCE | dc0183c84dde9b76 |
| 2026-10-06T03:12:28 | 6b7cd78d38ecbc9c9a8d7664696db1f52b1f77f9990d5543adfb11e7181afb9b.json | implementation | BLOCKED_WITH_EVIDENCE | 4a552c18ead6b0f7 |
| 2026-10-06T03:15:54 | 2a3be87367d32717deff8e928409b9d9218001579220a94cfeab6af11df61dc6.json | review | BLOCKED_WITH_EVIDENCE | 723d560d36f113c1 |
| 2026-10-06T03:29:34 | b98c15ca587e9017b058240e8d973222e7d995dd844daebce3ea53fca4675e63.json | implementation | VERIFIED | e02afc69ce17e4e0 |
| 2026-10-06T04:29:09 | f091730e041c7228a2b5da89b4c9710e99545b650d362d6013772e5b944c2530.json | review | BLOCKED_WITH_EVIDENCE | ea64100d2b1634df |
| 2026-10-06T04:41:18 | b729f11dc1ac51eeceb621051b4a0ac973f3e021e8913bdb53856692dd927310.json | implementation | BLOCKED_WITH_EVIDENCE | a68d1a2d8f8bbb76 |
| 2026-10-06T04:41:37 | f6acbc1eff93120d5ca121121ef13817bcbfc3ee1a4cf9a33407a42df3d05970.json | implementation | BLOCKED_WITH_EVIDENCE | 57f8f92ed5c58dbf |
| 2026-10-06T04:45:32 | 16f9e9f8e475c903c6cfbd9355f0046cae6671c38982ce0bab60c84c9b082be2.json | review | VERIFIED | 535829706b3a8907 |
| 2026-10-06T05:54:09 | 3a008675c497cad40d70efa5e75b31422cca79a152a410053db92af9bb61cd28.json | git | VERIFIED | 0c35e71d76a717be |
| 2026-10-06T14:14:53 | a8d03c66b15e02ec1cf07b9907f26d462a22ffd04e4fd7a619603a049fde185e.json | SOURCE_REPAIRS_COMPLETE_B | VERIFIED | 69de2879c1c92eac |
| 2026-10-06T14:15:41 | ca68190454c208e2194e62804e510180734d12f399db09f2967dc275297eaf46.json | SOURCE_REPAIRS_COMPLETE_B | VERIFIED | 4b04d9f7b86b3737 |
| 2026-10-06T14:24:19 | 3eb797b9ee108410dccf1ccbef6f37aaedbd555ec5d2db284afa13f86d5e1ed7.json | deploy | BLOCKED_WITH_EVIDENCE | f9885ce1a3a72b20 |
| 2026-10-07T22:20:05 | b2db63f0b0a7349131e672fef0b1961ba1d2226b9fd57a304bce1b96218c8ba2.json | deploy | BLOCKED_WITH_EVIDENCE | e0802735b1fb3f72 |
| 2026-10-07T22:29:41 | b8d6211cd2f09ab6888ccf29d0fd94fd8c2d8adab84e29602a582113f95db46f.json | diagnosis | VERIFIED | 5392ab0aab1a7f3b |
| 2026-10-08T00:30:57 | 364daf162bdc2d789a4b27a58e0bdb5625c1f4fce6e3919c1b9ce3010b82eae2.json | implementation | VERIFIED | 726858ab81a1533e |
| 2026-10-08T01:20:54 | 700685d0a5a15aa867134f526a2c8bc59c220e705e8cf1adca3e8268925496b3.json | diagnosis | VERIFIED | 834dfbb8e02620ed |
| 2026-10-08T01:24:37 | fcb7b3af0d03fe2d9f4fd238e1d74530a4c50338bffcdac36b49af8190ad720c.json | deploy | VERIFIED | 0469109ede6dd427 |
| 2026-10-08T01:30:34 | ae57ffb38605877a881b292bd44ddee455d72e3753661a02cdf3cf13d16038b6.json | implementation | VERIFIED | cc7b9148cb340090 |
| 2026-10-08T01:33:18 | 5863132dc96174e771143b88413b215fbdf8d809fb5dde229fe168f4878db923.json | git | VERIFIED | de59b831074b5d47 |
| 2026-10-08T01:42:36 | 91fff7b91fa6723111304f470465c432228ae06533fcc5b2f09094426b717f76.json | deploy | VERIFIED | e766137cbbc5c090 |
| 2026-10-08T01:44:04 | 7b32c044485c18377cd1d303e32a629cd45f3568bcb54ba98f27ca8e0953c0dc.json | git | VERIFIED | ca63952007cbfc9f |
| 2026-10-08T01:48:42 | 5abce27661b3ce71a8e64d5befe72d631c9f64f8c73f67a2d9dde81b3070be2e.json | diagnosis | VERIFIED | 6b63b653b8aecb31 |
| 2026-10-08T01:51:08 | aab1a91b7d4a6c0a18feded69cb8450089b7cd6d7f7000b167c42464a8755a2c.json | implementation | VERIFIED | bc911a81e4546895 |
| 2026-10-08T01:54:06 | 62105fe7d0f2add2c9288db8e37729aa5a0a5fb16a42bb388a8f2056757e1c06.json | review | VERIFIED | c2ddccb6891f7803 |
| 2026-10-08T01:55:56 | 6e7c90eea19d6704907bf21b43c1936fd6e45dc4910d21a6c0439692c718de2b.json | git | VERIFIED | d20347b6cb467280 |
| 2026-10-08T04:31:45 | a022-runtime-verification-20261008T043145Z.json | other | UNSPECIFIED | c550676d3ee82ea3 |
| 2026-10-08T04:35:18 | 93ee7b712425a20e319c371ef0b1617e7061ba9635fcbf519d6abd3da99a5a79.json | deploy | VERIFIED | 953afddda71d896d |
| 2026-10-08T10:54:46 | 20261008-wallet-authority-phase-closeout-evidence.json | implementation | BLOCKED_WITH_EVIDENCE | c8d9765e76e325f2 |
| 2026-10-08T10:54:54 | 2507dbf9b0f36cc91d9a327cae2ff117e1d007e55835436104b2bb7f3bd5479a.json | implementation | BLOCKED_WITH_EVIDENCE | 40d952851b9a07ae |
| 2026-10-08T11:01:45 | 20261008-backend-review-gate-evidence.json | review | BLOCKED_WITH_EVIDENCE | 2170b9c356012a54 |
| 2026-10-08T11:01:53 | ec1b53fb24bd3b00e25ea9c44b5753ffc69872ae2189eb8d0162176db1736699.json | review | BLOCKED_WITH_EVIDENCE | ce9a1d431154be60 |
| 2026-10-08T11:04:14 | 20261008-backend-commit-gate-failure.json | git | BLOCKED_WITH_EVIDENCE | c4bfbe698214f517 |
| 2026-10-08T11:04:20 | 93f89147a57ecdde0c4a971141686814fafe57ac8e0b2ef4e44084c546ba3adb.json | git | BLOCKED_WITH_EVIDENCE | 7e0cc3f07809eb0e |
| 2026-10-08T16:29:21 | 9461d37154950967a7ddea3d6eac04fdd7909ce4ae2b0613939281d0bed1f59f.json | implementation | BLOCKED_WITH_EVIDENCE | da46e8efc98cf00b |
| 2026-10-10T11:34:55 | 885b1a128e7cf0adf2a0a0f5870ff5058bc1ba81c0d06b90791ae92147525346.json | planning | BLOCKED_WITH_EVIDENCE | c52cf42a3622a078 |
| 2026-10-10T12:10:26 | 435680a5dbc31fd27967cff1478b48f4b941eb58cb3b6f7b200626d8b3f98e62.json | recovery | VERIFIED | b9756580bd3d9f85 |
| 2026-10-10T21:04:56 | backend-api-margin-d1-20261010.json | other | UNSPECIFIED | 9b5710821a41427d |
| 2026-10-10T21:04:56 | closeout-deploy-backend-20261010.json | deploy | BLOCKED_WITH_EVIDENCE | 8bd2736a0b1a90c9 |
| 2026-10-10T21:04:58 | f3196fc916e63c3fcd1e81e3afa9755c9a80b8d2c449793f156b8b1e2a48db4e.json | deploy | BLOCKED_WITH_EVIDENCE | c8617eb9470826fc |
| 2026-10-10T21:05:17 | closeout-diagnosis-backend-20261010.json | diagnosis | BLOCKED_WITH_EVIDENCE | 9fb08e02b0dac610 |
| 2026-10-10T21:05:17 | 75eae3021e53d97a4ebf828199871463021214ec78fd59a0978e0dec8af010fa.json | diagnosis | BLOCKED_WITH_EVIDENCE | 3eff24d53cc12fc4 |
| 2026-10-10T21:05:34 | backend-api-margin-d1-final-20261010.json | other | {'api': 'PROVEN_AVAILABLE',  | 8b9fdffb0de2e94e |
| 2026-10-10T21:05:34 | complete-backend-api-margin-d1-20261010.json | completion | BLOCKED_WITH_EVIDENCE | 0750270793097c11 |
| 2026-10-10T21:05:35 | d6b72db26b785360f294071ca4483dc3732e0567649ec90a6c05c0ccb6120498.json | completion | BLOCKED_WITH_EVIDENCE | 7abdc53b8e9343f2 |
| 2026-10-11T09:08:30 | eaf406b73e15cfb9bf18bc929caa48537a62e403f2fd46b8f3a82896573bf80e.json | completion | BLOCKED_WITH_EVIDENCE | 2478ee298b3568bd |
| 2026-10-11T09:18:15 | 56652e69a2afe4e237b459b47b58a4d124dcb472b93be2e5b8ea2406880607ee.json | recovery | BLOCKED_WITH_EVIDENCE | 712288a5b3abc0d6 |
| 2026-10-12T07:40:16 | d48b484a56a0f34e3556b852b81ab32c8bf25291e0201be121646bd193f4d719.json | implementation | BLOCKED_WITH_EVIDENCE | f0f15d4787905f59 |
| 2026-10-12T07:41:05 | b35ee55183ea11f2c9c6f801acc5d8c550ef2ba540b7c525919ed1dc0ad96a35.json | planning | VERIFIED | e971df961d87e8bd |

## Temp receipt/checkpoint/digest inventory — full reads and SHA256

| UTC mtime | Filename | Bytes | SHA256 prefix |
|---|---|---:|---|
| 2026-10-03 05:05 | nexi-public-implementation-checkpoint.json | 1868 | b1e3a08dd8e579e3 |
| 2026-10-03 07:50 | nexi-public-build-checkpoint.json | 2052 | fcd0aa4d15570ddd |
| 2026-10-03 07:58 | nexi-public-git-checkpoint.json | 1809 | 00e6ea72ba84d9a7 |
| 2026-10-03 07:59 | nexi-public-deploy-checkpoint.json | 2068 | 3d0ea030461f38d6 |
| 2026-10-03 08:01 | nexi-public-browser-checkpoint.json | 2472 | 6c5ef7f08dbeac28 |
| 2026-10-03 08:11 | nexi-public-legend-reroute-checkpoint.json | 1935 | d6c2fddf37847d0e |
| 2026-10-03 10:42 | nexi-public-test-receipt-20261003.json | 1402 | 4d81b0ede4b54eea |
| 2026-10-03 10:43 | nexi-public-git-receipt-20261003.json | 1167 | d611df3c906a3898 |
| 2026-10-03 10:46 | nexi-public-deploy-receipt-20261003.json | 1230 | 887f7361bb19d887 |
| 2026-10-03 14:48 | nexi-p04-checkpoint.txt | 652 | afc57c8f1d013d07 |
| 2026-10-05 05:45 | nexi-receipts-digest.txt | 79337 | 115887a120496694 |
| 2026-10-07 22:20 | nexi-backend-transition-receipt-20261008.json | 1651 | 40e37e44e32ee649 |
| 2026-10-11 09:08 | nexi-current-backend-phase-receipt.json | 2191 | 84d705819d02efbd |
| 2026-10-11 09:18 | nexi-backend-recovery-receipt.json | 2968 | 64c385852f2232ab |
| 2026-10-16 12:42 | nexi-checkpoint-control-repro.log | 467 | 59d09b94d7eacff2 |
| 2026-10-16 12:46 | nexi-checkpoint-fixed-test.log | 4751 | 87dfb21e64f8ee30 |
| 2026-10-16 12:56 | nexi-checkpoint-repeat-1.log | 481 | 7fe1732926aaca62 |
| 2026-10-16 12:56 | nexi-checkpoint-repeat-2.log | 481 | 4cb37717f9e8b166 |
| 2026-10-16 12:56 | nexi-checkpoint-repeat-3.log | 480 | 248650ae3deb1602 |
| 2026-10-16 13:07 | nexi-final-checkpoint-regression.log | 481 | e35e37f578183cfc |
| 2026-10-16 13:08 | nexi-checkpoint-typecheck.log | 0 | e3b0c44298fc1c14 |
| 2026-10-17 19:45 | NEXI-closeout-checkpoint-2026-10-18.md | 1428 | edd469b7f66e9608 |

## Recent test and proof logs — full reads and SHA256

| UTC mtime | Filename | Bytes | SHA256 prefix |
|---|---|---:|---|
| 2026-10-17 04:59 | nexi-agnix.log | 18456 | 9d80b7ded38c5641 |
| 2026-10-17 06:05 | nexi-d1-schema-export.log | 1034 | f76f53f41191da83 |
| 2026-10-17 11:03 | nexi-xvfb-99.log | 0 | e3b0c44298fc1c14 |
| 2026-10-17 11:03 | nexi-openbox-99.log | 85 | 6f748c3cd02a858c |
| 2026-10-17 11:35 | nexi-websockify-6080.log | 866 | 3dfa2b9e00282a46 |
| 2026-10-17 11:58 | nexi-x11vnc-99.log | 13379 | a95d6c86f2b8dec6 |
| 2026-10-17 16:33 | nexi-cache-clean-stdout.log | 57 | 15fb0fd5f0fa3142 |
| 2026-10-17 20:11 | nexi-lane-workflows.log | 532969 | e5bf489c6ed26938 |
| 2026-10-17 20:11 | nexi-lane-margin.log | 739323 | 38c807087b7a1e57 |
| 2026-10-17 20:11 | nexi-lane-admin.log | 949308 | 7ecfe1b790636dc2 |
| 2026-10-17 20:15 | nexi-admin-direct-verify.log | 513 | c5cab162e4fe893c |
| 2026-10-17 20:16 | nexi-direct-tsc.log | 1379 | fd6bac2493395aec |
| 2026-10-17 20:17 | nexi-admin-only-tsc.log | 0 | e3b0c44298fc1c14 |
| 2026-10-17 20:35 | nexi-margin-closing-tsc.log | 0 | e3b0c44298fc1c14 |
| 2026-10-17 20:39 | nexi-margin-replay-typecheck.log | 0 | e3b0c44298fc1c14 |
| 2026-10-17 20:50 | nexi-margin-entry-tsc.log | 0 | e3b0c44298fc1c14 |
| 2026-10-17 20:51 | nexi-margin-entry-regression.log | 519 | 3907b28abc6e051c |
| 2026-10-17 20:56 | nexi-margin-typecheck-current.log | 0 | e3b0c44298fc1c14 |
| 2026-10-17 21:20 | nexi-current-typecheck.log | 0 | e3b0c44298fc1c14 |
| 2026-10-17 21:22 | nexi-recovery-tsc.log | 0 | e3b0c44298fc1c14 |
| 2026-10-17 21:22 | nexi-margin-recovery-tests.log | 2339 | 22071eac104c45b1 |
| 2026-10-17 21:23 | nexi-margin-check.log | 0 | e3b0c44298fc1c14 |
| 2026-10-17 21:24 | nexi-margin-fix-two-tests.log | 692 | 2bcb709b2b58f10a |
| 2026-10-17 21:24 | nexi-margin-close-sqlite-test.log | 4269 | 0c1cc3087e715899 |
| 2026-10-17 21:25 | nexi-close-sqlite-node22.log | 1701 | ba01c430009d009e |
| 2026-10-17 21:25 | nexi-close-recovery-finaltest.log | 659 | a75a65d4e16859f5 |
| 2026-10-17 21:26 | nexi-margin-recovery-12.log | 697 | 0a0d30722698ef1c |
| 2026-10-17 21:27 | nexi-margin-recovery-2.log | 660 | 1b431cf480cf7878 |
| 2026-10-17 21:28 | nexi-existing-workflow-tests-20261018.log | 4697 | 636917aa8ba39c23 |
| 2026-10-17 21:29 | nexi-workflow-debug.log | 1597 | ad347629a362cbf5 |
| 2026-10-17 21:29 | nexi-workflow-alone.log | 1160 | 962027ae7fbb589c |
| 2026-10-17 21:30 | nexi-close-tests-final.log | 682 | b3b9eaae00557e6e |
| 2026-10-17 21:30 | nexi-close-tsc-final.log | 0 | e3b0c44298fc1c14 |
| 2026-10-17 21:31 | nexi-workflow-coordinator-proof.log | 1015 | 7958724ed376273f |
| 2026-10-17 21:32 | nexi-close-marketindependent-tsc.log | 0 | e3b0c44298fc1c14 |
| 2026-10-17 21:32 | nexi-close-marketindependent-tests.log | 697 | 8cc30d8d6e1e6d2b |
| 2026-10-17 21:34 | nexi-margin-settlement-ledger-proof.log | 2076 | a6ceeb0b3989d7da |
| 2026-10-17 21:36 | nexi-margin-final-proof.log | 682 | 0020f945ba5dc157 |
| 2026-10-17 21:36 | nexi-compile-final.log | 0 | e3b0c44298fc1c14 |
| 2026-10-17 21:37 | nexi-financial-final-proof.log | 551 | c0151063840a7f38 |
| 2026-10-17 21:43 | nexi-binary-historical-tsc.log | 0 | e3b0c44298fc1c14 |
| 2026-10-17 21:43 | nexi-binary-historical-service.log | 2115 | e963785851e88ab7 |
| 2026-10-17 21:44 | nexi-binary-historical-gateway.log | 2191 | c1e013489e0c8ce1 |
| 2026-10-17 21:45 | nexi-binary-fallow-20261018.log | 621 | ae34100055babef8 |
| 2026-10-17 21:48 | nexi-final-source-build.log | 37 | 0de4692e4208e8b0 |
| 2026-10-17 21:53 | nexi-loan-cas-backfill-test.log | 678 | e179704d45707cfb |
| 2026-10-17 21:53 | nexi-loan-live-dryrun.log | 55 | 00186738cf1775a5 |
| 2026-10-17 21:55 | nexi-loan-cas-migrate-final-tests.log | 988 | 66e8aafb8896d6a5 |
| 2026-10-17 21:55 | nexi-loan-live-preflight-final.log | 55 | 00186738cf1775a5 |
| 2026-10-18 04:05 | nexi-next-service.log | 482 | dc6a6ecf0b11b117 |
| 2026-10-18 04:06 | nexi-next-financial.log | 551 | abf13b14cdf48b12 |
| 2026-10-18 04:07 | nexi-loan-complete-replay-red.log | 3075 | fbaf6d8a5fb4a840 |
| 2026-10-18 04:08 | nexi-loan-replay-tsc.log | 0 | e3b0c44298fc1c14 |
| 2026-10-18 04:08 | nexi-loan-replay-green.log | 2280 | 091c4316ed86ad73 |
| 2026-10-18 04:12 | nexi-margin-close-key-service.log | 1377 | b8766adfd866a6a4 |
| 2026-10-18 04:12 | nexi-margin-close-key-tsc.log | 0 | e3b0c44298fc1c14 |
| 2026-10-18 04:13 | nexi-margin-close-key-gateway.log | 670 | ac1d21182d032152 |
| 2026-10-18 04:15 | nexi-20261018-closure-build.log | 37 | 0de4692e4208e8b0 |
| 2026-10-18 04:15 | nexi-20261018-workflow.log | 1013 | 13fb8233ec9e0400 |
| 2026-10-18 04:17 | nexi-workflow-combined-current.log | 4697 | 222c944821c3e1d1 |
| 2026-10-18 04:18 | nexi-workflow-inconsistent-debug.log | 2023 | a3d45691c8a5632a |
| 2026-10-18 04:22 | nexi-workflow-store-isolated-now.log | 1164 | e7c28f42b1bcb44e |
| 2026-10-18 04:23 | nexi-workflow-full-repro-debug.log | 1881 | 6e6dcd1b89f4b369 |
| 2026-10-18 04:51 | nexi-20261018-multidomain-units.log | 1150 | a58110c012bd7526 |
| 2026-10-18 04:52 | nexi-20261018-multidomain-sqlite.log | 4385 | 694e8866124ea08a |
| 2026-10-18 05:00 | nexi-conversion-correct-config-2.log | 516 | e1ddd508654a3354 |
| 2026-10-18 05:09 | nexi-postrelease-wallet-isolated.log | 2322 | 8ccdd20c7e858b55 |
| 2026-10-18 06:32 | nexi-workflow-current-lane.log | 509 | 8b309bef9f478178 |
| 2026-10-18 06:32 | nexi-auth-http-lane.log | 3631 | 0bf5adba8597339a |
| 2026-10-18 06:57 | nexi-auth-surface-typecheck.log | 0 | e3b0c44298fc1c14 |
| 2026-10-18 06:57 | nexi-auth-surface-regression.log | 630 | 9384c4c9786d2689 |
| 2026-10-18 06:59 | nexi-auth-surface-buildcheck.log | 0 | e3b0c44298fc1c14 |
| 2026-10-18 06:59 | nexi-auth-surface-accept.log | 529 | 6286cfaf4a9fd18a |
| 2026-10-18 07:00 | nexi-auth-surface-build.log | 37 | 0de4692e4208e8b0 |
| 2026-10-18 07:00 | nexi-workflow-after-guard.log | 523 | ade5c82a54e7cc53 |
| 2026-10-18 07:05 | nexi-auth-surface-retest-tsc.log | 0 | e3b0c44298fc1c14 |
| 2026-10-18 07:05 | nexi-auth-surface-runtime-guards.log | 1781 | b0daeaf706d1df7f |
| 2026-10-18 07:11 | nexi-domain-guard-tsc.log | 0 | e3b0c44298fc1c14 |
| 2026-10-18 07:11 | nexi-domain-guard-tests.log | 510 | 70b861275c88f851 |
| 2026-10-18 07:12 | nexi-expanded-surface-http.log | 731 | 02f7404f64d2f2e1 |
| 2026-10-18 07:12 | nexi-expanded-surface-fallow.log | 4031 | 31e1654a4211dde8 |
| 2026-10-18 07:13 | nexi-all-domain-guards-build.log | 37 | 0de4692e4208e8b0 |
| 2026-10-18 18:46 | nexi-full-jest-20261019.log | 40423 | c8561a5b41347801 |
| 2026-10-18 18:49 | nexi-local-verified-20261019.log | 7502 | bda816e8df4abfd1 |
| 2026-10-18 20:16 | nexi-typecheck-doctor-20261019.log | 0 | e3b0c44298fc1c14 |
| 2026-10-18 20:18 | nexi-bounded-typecheck-20261019.log | 0 | e3b0c44298fc1c14 |
| 2026-10-18 20:23 | nexi-source-static-20261019.log | 0 | e3b0c44298fc1c14 |
| 2026-10-18 20:24 | nexi-doctor-post-source-20261019.log | 87 | 8dd7af459f71c0fd |
| 2026-10-18 20:27 | nexi-static-typecheck-final-source.log | 0 | e3b0c44298fc1c14 |
| 2026-10-18 20:28 | nexi-fallow-20261019.log | 46783 | 3ac3f48bda7178ff |
| 2026-10-18 20:31 | nexi-doctor-final-diagnostics-20261019.log | 87 | 8dd7af459f71c0fd |
| 2026-10-18 20:54 | nexi-targeted-changed-contracts-20261019.log | 611 | f9ca7eaee43c9608 |
| 2026-10-18 20:55 | nexi-build-cce014d-20261019.log | 37 | 0de4692e4208e8b0 |
| 2026-10-18 21:10 | nexi-kyc-typecheck.log | 0 | e3b0c44298fc1c14 |
| 2026-10-18 21:11 | nexi-kyc-regression.log | 320 | a7d90d8fd06ffc2c |
| 2026-10-19 04:22 | nexi-mining-typecheck-20261019.log | 0 | e3b0c44298fc1c14 |
| 2026-10-19 04:24 | nexi-mining-regress.log | 332 | d8974adcdc19bd98 |
| 2026-10-19 04:26 | nexi-financial-graph-20261019.log | 0 | e3b0c44298fc1c14 |
| 2026-10-19 04:27 | nexi-binary-mining-typecheck.log | 0 | e3b0c44298fc1c14 |
| 2026-10-19 04:29 | nexi-binary-direct-contract-20261019.log | 383 | 0307e3ad991f95b0 |
| 2026-10-19 04:35 | nexi-doctor-current-bounded-20261019.log | 87 | 8dd7af459f71c0fd |
| 2026-10-19 04:39 | nexi-build-033f6f2-20261019.log | 37 | 0de4692e4208e8b0 |
| 2026-10-19 08:52 | nexi-polypane-5859.log | 19792 | 9b3eef3d2b7e2d9e |

Inventory: 120 parsed phase JSON receipts; 22 temp receipt/checkpoint/digest files; 103 recent test/proof logs. Phase dates: {'2026-10-02': 8, '2026-10-03': 42, '2026-10-04': 8, '2026-10-05': 14, '2026-10-06': 12, '2026-10-07': 2, '2026-10-08': 20, '2026-10-10': 10, '2026-10-11': 2, '2026-10-12': 2}. Protected systemd-private mounts, binary caches and unrelated temp files excluded. Overlapping receipts are not additive.
