/* NEXI Graphify static TypeScript scanner — source only; never imports app modules. */
'use strict';
const fs = require('fs');
const path = require('path');
const {createRequire}=require('module');
const input = JSON.parse(fs.readFileSync(0,'utf8'));
const root = path.resolve(input.root);
const req = createRequire(path.join(root,'package.json'));
const ts = req('typescript');
const configFile=ts.findConfigFile(root,ts.sys.fileExists,'tsconfig.json');
let compilerOptions={moduleResolution:ts.ModuleResolutionKind.Node10,allowJs:true};
if(configFile){
 const read=ts.readConfigFile(configFile,ts.sys.readFile);
 if(read.error)throw new Error('Invalid TypeScript config: '+ts.flattenDiagnosticMessageText(read.error.messageText,' '));
 const parsed=ts.parseJsonConfigFileContent(read.config,ts.sys,path.dirname(configFile),undefined,configFile);
 compilerOptions=parsed.options;
}
const moduleCache=ts.createModuleResolutionCache(root,x=>x,compilerOptions);
// Real program/type-checker: unlike createSourceFile() this resolves imported
// aliases, re-exports, decorators and JSX symbols across project source.
const program=ts.createProgram({rootNames:(input.paths||[]).map(x=>path.resolve(x)),
  options:{...compilerOptions,noEmit:true,incremental:false}});
const checker=program.getTypeChecker();
const out = {version:'nexi-typescript-v1', typescript:ts.version, records:[], failures:[]};
const methods = new Set(['findUnique','findUniqueOrThrow','findFirst','findFirstOrThrow','findMany','create','createMany','createManyAndReturn','update','updateMany','updateManyAndReturn','upsert','delete','deleteMany','count','aggregate','groupBy']);
const verbs = new Set(['Get','Post','Put','Patch','Delete','Head','Options','All']);
function text(n){return n ? n.getText() : '';}
function lit(n){
 if(!n)return null;
 if(ts.isStringLiteralLike(n) || ts.isNoSubstitutionTemplateLiteral(n))return n.text;
 if(ts.isNumericLiteral(n))return n.text;
 if(n.kind===ts.SyntaxKind.TrueKeyword)return true;
 if(n.kind===ts.SyntaxKind.FalseKeyword)return false;
 return null;
}
function unwrap(n){
 while(n&&(ts.isAsExpression(n)||ts.isTypeAssertionExpression(n)||ts.isParenthesizedExpression(n)||ts.isSatisfiesExpression(n)||ts.isNonNullExpression(n)))n=n.expression;
 return n;
}
function props(n){
 const m={};if(!n||!ts.isObjectLiteralExpression(n))return m;
 for(const p of n.properties){
  if(ts.isPropertyAssignment(p)||ts.isShorthandPropertyAssignment(p))
   m[text(p.name).replace(/^['"]|['"]$/g,'')]=ts.isPropertyAssignment(p)?p.initializer:p.name;
 }
 return m;
}
function decorators(node){
 if(typeof ts.canHaveDecorators==='function' && ts.canHaveDecorators(node)) return ts.getDecorators(node)||[];
 return node.decorators||[];
}
function dec(n, name){
 for(const d of decorators(n)){
  const e=d.expression;
  const f=ts.isCallExpression(e)?e.expression:e;
  if(text(f).split('.').pop()===name)return ts.isCallExpression(e)?e:null;
 }
 return null;
}
function arg0(call){return call&&call.arguments.length?lit(call.arguments[0]):null;}
function nameOf(n){return n&&n.name?text(n.name):'';}
function receiverOf(e){return ts.isPropertyAccessExpression(e)?text(e.expression):text(e);}
function chainRoot(e){while(ts.isPropertyAccessExpression(e)||ts.isElementAccessExpression(e))e=e.expression;return text(e);}
function walk(sf, visit){const recur=n=>{visit(n);ts.forEachChild(n,recur);};recur(sf);}
function nearest(n, predicate){for(let a=n;a;a=a.parent)if(predicate(a))return a;return null;}
function owner(n){const a=nearest(n,x=>ts.isMethodDeclaration(x)||ts.isFunctionDeclaration(x)||ts.isConstructorDeclaration(x)||ts.isArrowFunction(x)||ts.isClassDeclaration(x));
 if(!a)return '<module>';
 const cls=nearest(a.parent,x=>ts.isClassDeclaration(x));
 const nme=ts.isConstructorDeclaration(a)?'constructor':nameOf(a)||(ts.isArrowFunction(a)?'<arrow>':'<anonymous>');
 return (cls?nameOf(cls)+'.':'')+nme;
}
function location(n,sf){const p=sf.getLineAndCharacterOfPosition(n.getStart(sf));return {line:p.line+1,column:p.character+1,start:n.getStart(sf)};}
function declarationTarget(n){
 if(!n)return {};
 let symbol;
 try{symbol=checker.getSymbolAtLocation(n);}
 catch{return {};}
 if(!symbol && ts.isPropertyAccessExpression(n))symbol=checker.getSymbolAtLocation(n.name);
 if(!symbol && ts.isQualifiedName(n))symbol=checker.getSymbolAtLocation(n.right);
 if(!symbol)return {};
 try{if(symbol.flags&ts.SymbolFlags.Alias)symbol=checker.getAliasedSymbol(symbol);}catch{return {};}
 const sites=(symbol.declarations||[]).filter(d=>{
   const f=path.resolve(d.getSourceFile().fileName);
   return f.startsWith(root+path.sep) && !/(?:^|\/)(?:node_modules|dist|generated)(?:\/|$)/.test(f);
 });
 if(sites.length!==1)return {};
 const d=sites[0],f=d.getSourceFile(),pos=f.getLineAndCharacterOfPosition(d.getStart(f));
 const name=String(symbol.getName()||'');
 return {target_file:path.relative(root,f.fileName).split(path.sep).join('/'),
         target_name:name,target_line:pos.line+1};
}
function nestForwardRefTarget(n,sf){
 n=unwrap(n);
 if(!n||!ts.isCallExpression(n)||!ts.isIdentifier(n.expression)||n.arguments.length!==1)return {};
 const called=n.expression.text;
 const isNestImport=sf.statements.some(st=>
   ts.isImportDeclaration(st)&&lit(st.moduleSpecifier)==='@nestjs/common'&&
   st.importClause&&st.importClause.namedBindings&&
   ts.isNamedImports(st.importClause.namedBindings)&&
   st.importClause.namedBindings.elements.some(el=>
     el.name.text===called&&(el.propertyName?.text||el.name.text)==='forwardRef'));
 if(!isNestImport)return {};
 const cb=unwrap(n.arguments[0]);
 if(!ts.isArrowFunction(cb)||cb.parameters.length!==0)return {};
 const target=unwrap(cb.body);
 if(!ts.isIdentifier(target)&&!ts.isPropertyAccessExpression(target))return {};
 return declarationTarget(target);
}
function record(rel,sf,n,kind,detail={}){
 const l=location(n,sf);
 const declaration=nearest(n,x=>ts.isMethodDeclaration(x)||
    ts.isConstructorDeclaration(x)||ts.isFunctionDeclaration(x)||
    ts.isClassDeclaration(x)||ts.isFunctionExpression(x));
 const anchor=declaration?location(declaration,sf):null;
 out.records.push({file:rel,kind,owner:owner(n),...l,
   owner_decl_line:anchor?.line||null,
   owner_decl_name:declaration?(ts.isConstructorDeclaration(declaration)?'constructor':nameOf(declaration)):null,
   ...detail});
}
function moduleInfo(n,sf,rel){
 const d=dec(n,'Module');if(!d)return;
 record(rel,sf,n,'nest_module',{module:nameOf(n),global:!!dec(n,'Global')});
 const o=props(d.arguments[0]);
 for(const [key,kind] of [['imports','module_import'],['exports','module_export'],['controllers','module_controller'],['providers','module_provider']]){
  const v=o[key];if(!v)continue;
  const arr=ts.isArrayLiteralExpression(v)?v.elements:[v];
  for(const e of arr){
   if(ts.isObjectLiteralExpression(e)){
    const x=props(e);
    record(rel,sf,e,kind,{module:nameOf(n),symbol: text(x.provide||e).slice(0,160),
      useClass:text(x.useClass||'').slice(0,160),useExisting:text(x.useExisting||'').slice(0,160),
      factory:!!x.useFactory,value:!!x.useValue,
      factory_inject_tokens:(x.inject && ts.isArrayLiteralExpression(x.inject))?
        x.inject.elements.filter(y=>ts.isIdentifier(y)||ts.isStringLiteralLike(y)).map(text):[],
      factory_inject_unresolved:(x.inject && ts.isArrayLiteralExpression(x.inject))?
        x.inject.elements.filter(y=>!ts.isIdentifier(y)&&!ts.isStringLiteralLike(y)).length:
        (x.inject?1:0),
      ...declarationTarget(x.useClass||x.useExisting||x.provide)});
   }else record(rel,sf,e,kind,{module:nameOf(n),symbol:text(e).slice(0,160),...((kind==='module_import'||kind==='module_export')?{...declarationTarget(e),...nestForwardRefTarget(e,sf)}:declarationTarget(e))});
  }
 }
}
function parseFile(file){
 const full=path.resolve(file);
 if(!full.startsWith(root+path.sep))return;
 const rel=path.relative(root,full).split(path.sep).join('/');
 if(/(^|\/)(?:node_modules|dist|build|coverage|\.next|\.output|generated|__tests__)\//.test(rel)||/\.(?:test|spec)\.[cm]?[jt]sx?$/.test(rel)||/(?:^|\/)routeTree\.gen\.[jt]sx?$/.test(rel))return;
 if(!/\.(?:ts|tsx|js|jsx|mts|cts|mjs|cjs)$/.test(rel))return;
 let code;
 try{code=fs.readFileSync(full,'utf8');}catch(e){out.failures.push({file:rel,reason:'read:'+e.message});return;}
 const kind=/\.tsx$|\.jsx$/.test(rel)?ts.ScriptKind.TSX:ts.ScriptKind.TS;
 const sf=program.getSourceFile(full)||ts.createSourceFile(full,code,ts.ScriptTarget.Latest,true,kind);
 if(sf.parseDiagnostics.length)out.failures.push({file:rel,reason:'parse-diagnostics',count:sf.parseDiagnostics.length});
 const surface=input.surface||path.basename(root);
 const routePattern=/^(?:app|src\/app)\/(.*)\/(page|layout|template|loading|error|not-found|default|route)\.[jt]sx?$|^(?:app|src\/app)\/(page|layout|template|loading|error|not-found|default|route)\.[jt]sx?$/;
 const route=rel.match(routePattern);
 if(route){
  const kind=route[2]||route[3], segments=(route[1]||'').split('/').filter(Boolean);
  const url='/'+segments.filter(x=>!(/^\(.*\)$/.test(x)||/^@/.test(x))).map(x=>x).join('/');
  record(rel,sf,sf,'next_file_route',{routeKind:kind,route:url,surface});
 }
 const ds=sf.statements.filter(ts.isExpressionStatement).map(x=>lit(x.expression)).filter(Boolean);
 if(ds.includes('use client')||ds.includes('use server')) record(rel,sf,sf,'module_boundary',{boundary:ds.includes('use client')?'client':'server'});
 const bindings=[];
 function bindVar(name, value, site){
  const block=nearest(site.parent,x=>ts.isBlock(x)||ts.isSourceFile(x))||sf;
  bindings.push({name,value,start:site.getStart(sf),scopeStart:block.getStart(sf),scopeEnd:block.end});
 }
 function lookupVar(name,site){
  const at=site.getStart(sf);
  const candidates=bindings.filter(x=>x.name===name&&x.start<=at&&x.scopeStart<=at&&at<x.scopeEnd);
  candidates.sort((a,b)=>(a.scopeEnd-a.scopeStart)-(b.scopeEnd-b.scopeStart)||b.start-a.start);
  return candidates[0]?.value||null;
 }
 const classes=new Map();
 const imported=new Map();
 const constants=new Map();
 const loopVariables=[];
 walk(sf,n=>{
  if(ts.isImportDeclaration(n)&&ts.isStringLiteral(n.moduleSpecifier)){
   const origin=n.moduleSpecifier.text;
   const clause=n.importClause;
   const resolution=ts.resolveModuleName(origin,full,compilerOptions,ts.sys,moduleCache).resolvedModule;
   const source=resolution&&path.resolve(resolution.resolvedFileName);
   const resolved=source&&source.startsWith(root+path.sep)?path.relative(root,source).split(path.sep).join('/'):null;
   function binding(local,exported,element){
    imported.set(local,origin+':'+exported);
    record(rel,sf,element,'import_binding',{local,exported,source_module:origin,resolved_file:resolved,...declarationTarget(element.name||element)});
   }
   if(clause?.name)binding(text(clause.name),'default',clause.name);
   const bindings=clause?.namedBindings;
   if(bindings&&ts.isNamedImports(bindings))
    for(const part of bindings.elements)
     binding(text(part.name),text(part.propertyName||part.name),part);
   if(bindings&&ts.isNamespaceImport(bindings))binding(text(bindings.name),'*',bindings);
  }
  if(ts.isVariableDeclaration(n)&&n.initializer){
   const initializer=unwrap(n.initializer), name=text(n.name);
   if(ts.isArrayLiteralExpression(initializer)){
    const values=initializer.elements.map(x=>lit(unwrap(x)));
    if(values.length&&values.every(x=>typeof x==='string'))constants.set(name,values);
   }else if(typeof lit(initializer)==='string')constants.set(name,lit(initializer));
  }
  if(ts.isForOfStatement(n)&&ts.isVariableDeclarationList(n.initializer)){
   const binding=n.initializer.declarations[0];
   if(binding&&ts.isIdentifier(binding.name))
    loopVariables.push({name:text(binding.name),array:text(n.expression),start:n.getStart(sf),end:n.end});
  }
 });
 function queueValues(expr,at){
  expr=unwrap(expr);
  const value=lit(expr);
  if(typeof value==='string')return [value];
  if(!expr||!ts.isIdentifier(expr))return [];
  const constant=constants.get(text(expr));
  if(typeof constant==='string')return [constant];
  if(Array.isArray(constant))return constant;
  const loop=loopVariables.find(x=>x.name===text(expr)&&at.getStart(sf)>=x.start&&at.end<=x.end);
  const values=loop&&constants.get(loop.array);
  return Array.isArray(values)?values:[];
 }
 function socketURL(expr){
  const direct=lit(expr);
  if(typeof direct==='string'){
   try{return {origin:direct,namespace:new URL(direct).pathname||'/'};}
   catch{return {origin:direct,namespace:direct.startsWith('/')?direct:'/'};}
  }
  if(expr&&ts.isTemplateExpression(expr)){
   const tail=expr.templateSpans[expr.templateSpans.length-1]?.literal.text||'';
   const ns=tail.match(/(\/[A-Za-z][A-Za-z0-9/_-]*)$/);
   return {origin:null,namespace:ns?ns[1]:null};
  }
  return {origin:null,namespace:null};
 }
 const gatewayWrappers=new Set();
 walk(sf,n=>{
  if(!ts.isMethodDeclaration(n))return;
  const cl=nearest(n.parent,x=>ts.isClassDeclaration(x));
  if(!cl||!dec(cl,'WebSocketGateway')||!n.body)return;
  const params=new Set(n.parameters.map(x=>text(x.name)));
  walk(n.body,c=>{
   if(!ts.isCallExpression(c)||!ts.isPropertyAccessExpression(c.expression))return;
   if(c.expression.name.text!=='emit'||!/^this\.(?:server|io|socket)\b/.test(text(c.expression.expression)))return;
   if(c.arguments[0]&&params.has(text(c.arguments[0])))gatewayWrappers.add(nameOf(n));
  });
 });
 walk(sf,n=>{
  if(ts.isClassDeclaration(n)){
   const cls=nameOf(n);classes.set(cls,n);moduleInfo(n,sf,rel);
   if(dec(n,'Injectable'))record(rel,sf,n,'nest_service',{service:cls});
   const ctl=dec(n,'Controller');if(ctl)record(rel,sf,n,'nest_controller',{controller:cls,prefix:arg0(ctl)||''});
   const gw=dec(n,'WebSocketGateway');if(gw){
    const options=gw.arguments.find(ts.isObjectLiteralExpression);
    const o=props(options);
    record(rel,sf,n,'socket_gateway',{gateway:cls,namespace:lit(o.namespace)||'/'});
   }
  }
  if(ts.isConstructorDeclaration(n)){
   const cls=nearest(n.parent,x=>ts.isClassDeclaration(x));
   const nestClass=cls&&['Injectable','Controller','WebSocketGateway','Module',
                          'Processor','Catch'].some(name=>!!dec(cls,name));
   for(const param of n.parameters){
    const queueInjection=dec(param,'InjectQueue');
    const injection=dec(param,'Inject');
    // A constructor parameter in a plain TS/React class is not NestJS DI.
    if(!nestClass&&!injection&&!queueInjection)continue;
    const token=queueInjection?text(queueInjection.arguments[0]):injection?text(injection.arguments[0]):text(param.type);
    if(token){
     const targetNode=injection?injection.arguments[0]:
       queueInjection?queueInjection.arguments[0]:
       (ts.isTypeReferenceNode(param.type)?param.type.typeName:param.type);
     const binding=imported.get(text(targetNode).split('.')[0])||'';
     const origin=binding.slice(0,binding.lastIndexOf(':'));
     const external=origin&&!origin.startsWith('.')&&!origin.startsWith('/')&&!origin.startsWith('@/');
     record(rel,sf,param,queueInjection?'nest_inject_queue':'nest_inject',
                    {token:token.slice(0,160),queue:queueInjection?lit(queueInjection.arguments[0]):null,
                     param:nameOf(param),class:nameOf(nearest(n.parent,x=>ts.isClassDeclaration(x))),
                     ...(external?{external_module:origin}:{}),...declarationTarget(targetNode)});
    }
   }
  }
  if(ts.isMethodDeclaration(n)){
   for(const verb of verbs){
    const d=dec(n,verb);
    if(d)record(rel,sf,n,'nest_route_method',{verb:verb.toUpperCase(),route:arg0(d)||'',method:nameOf(n)});
   }
   for(const deco of ['UseGuards','UseInterceptors','UsePipes','UseFilters']){
    const target=dec(n,deco);
    if(target){
     for(const a of target.arguments)
      record(rel,sf,n,'nest_middleware',{middleware:deco,token:text(a),method:nameOf(n)});
    }
   }
   const sm=dec(n,'SubscribeMessage');
   if(sm){
     const klass=nearest(n.parent,x=>ts.isClassDeclaration(x));
     const gateway=klass&&dec(klass,'WebSocketGateway');
     const opts=gateway?props(gateway.arguments.find(ts.isObjectLiteralExpression)):{};
     record(rel,sf,n,'socket_listener',{event:arg0(sm),namespace:gateway?(lit(opts.namespace)||'/'):null,direction:'client_to_server',method:nameOf(n)});
   }
  }
  if(ts.isVariableDeclaration(n)&&n.initializer){
   const expr=n.initializer;
   if(ts.isNewExpression(expr)){
    const sourceClass=text(expr.expression).split('.').pop();
    const importedFrom=imported.get(text(expr.expression))||'';
    const cls=importedFrom.startsWith('bullmq:')?importedFrom.split(':')[1]:sourceClass;
    if(['Queue','Worker','QueueEvents','FlowProducer'].includes(cls)){
     if(importedFrom==='bullmq:'+cls || importedFrom==='bullmq'){
      const values=queueValues(expr.arguments?.[0],n);
      const options=cls==='Worker'?expr.arguments?.[2]:expr.arguments?.[1];
      const cfg=props(options),prefix=cfg.prefix?text(cfg.prefix):null;
      const connection=cfg.connection?text(cfg.connection):null;
      bindVar(text(n.name),{type:cls,queue:values.length===1?values[0]:null,queueCandidates:values,prefix,connection},n);
      for(const queue of values.length?values:[null])
       record(rel,sf,n,'bull_instance',{instance:cls,variable:text(n.name),queue,
                                       prefixExpression:prefix,connectionExpression:connection,
                                       queueCandidates:values,jobHandler:cls==='Worker'});
     }else if(sourceClass==='Worker' && !importedFrom){
      record(rel,sf,n,'browser_worker',{target:lit(expr.arguments?.[0])});
     }
    }
   }
   if(ts.isCallExpression(expr)&&imported.get(text(expr.expression))?.startsWith('socket.io-client:')){
    const scoped=socketURL(expr.arguments[0]);
    bindVar(text(n.name),{type:'socket',...scoped},n);
    record(rel,sf,n,'socket_client',{variable:text(n.name),...scoped});
   }
  }
  if(ts.isBinaryExpression(n)&&n.operatorToken.kind===ts.SyntaxKind.EqualsToken &&
     ts.isCallExpression(n.right)&&imported.get(text(n.right.expression))?.startsWith('socket.io-client:')){
    const scoped=socketURL(n.right.arguments[0]);
    bindVar(text(n.left),{type:'socket',...scoped},n);
    record(rel,sf,n,'socket_client',{variable:text(n.left),...scoped});
  }
  if(ts.isPropertyAssignment(n)&&text(n.name).replace(/^['"]|['"]$/g,'')==='sql'){
   const statement=lit(n.initializer);
   if(typeof statement==='string'&&/^\s*(?:SELECT|INSERT|UPDATE|DELETE|REPLACE|CREATE|ALTER|DROP|WITH)\b/i.test(statement))
    record(rel,sf,n,'sqlite_statement',{sql:statement.slice(0,500),dynamic:false,receiver:'object.sql'});
  }
  if(ts.isNewExpression(n)&&text(n.expression).split('.').pop()==='DurableQueueTransport'){
   const args=n.arguments||[];
   record(rel,sf,n,'durable_transport_link',{
     storeExpression:text(args[0]),queueMapExpression:text(args[1]),
     queueCandidates:constants.get('QUEUE_NAMES')||[],
     matching_scope:'source-declared-map-only'
   });
  }
  if(ts.isCallExpression(n)){
   const e=n.expression, callee=text(e);
   const args=n.arguments;
   if(callee==='createFileRoute'||callee==='createLazyFileRoute'||callee==='createRootRoute')
    record(rel,sf,n,'tanstack_route',{route:arg0(n),factory:callee});
   if(callee==='createServerFn')
    record(rel,sf,n,'tanstack_server_function',{function:owner(n),api:'createServerFn'});
   if(callee==='createAPIFileRoute'||callee==='createServerFileRoute')
    record(rel,sf,n,'tanstack_server_route',{route:arg0(n),api:callee});
   if(callee==='BullModule.registerQueue'||callee==='BullModule.registerQueueAsync'){
    for(const a of args){
     const o=props(a);
     if(o.name)record(rel,sf,n,'bull_registration',{queue:lit(o.name),prefix:lit(o.prefix)});
    }
   }
   if(ts.isPropertyAccessExpression(e)){
    const method=e.name.text,recv=receiverOf(e);
    const parts=recv.split('.'),rootVar=parts[0].replace(/^this\./,'');
    if(methods.has(method)&&parts.length>=2){
     const model=parts[parts.length-1];
     if(model&&/^[a-zA-Z_$][\w$]*$/.test(model) &&
        /(?:^|\.)(?:prisma|prismaClient|db|d1|database|client)(?:\.|$)/i.test(recv))
      record(rel,sf,n,'prisma_operation',{model,operation:method,receiver:recv});
    }
    if(['$transaction','$queryRaw','$executeRaw','$queryRawUnsafe','$executeRawUnsafe'].includes(method))
     record(rel,sf,n,'prisma_transaction',{operation:method,receiver:recv});
    if(method==='prepare'&&args[0]){
     const sql=lit(args[0]);
     record(rel,sf,n,'sqlite_statement',{sql:typeof sql==='string'?sql.slice(0,500):null,dynamic:typeof sql!=='string',receiver:recv});
    }
    if(['run','get','all','iterate','exec','transaction'].includes(method)&&/prepare\(|sqlite|db\b|bridge|statement|stmt/i.test(recv))
     record(rel,sf,n,method==='transaction'?'sqlite_transaction':'sqlite_execution',{operation:method,receiver:recv.slice(0,140)});
    if(method==='record' && /(?:^|\.)(?:journal|store)$/.test(recv)){
     record(rel,sf,n,'durable_journal_record',{
       queue:lit(args[0]),logicalKey:lit(args[1]),receiver:recv,
       queueExpression:text(args[0]),ordering:'durable-record-before-bull-dispatch'
     });
    }
    if(['recordEventOutbox','recordEventInbox','claimPendingEventOutbox','markEventOutboxPublished',
         'markEventOutboxRetry','recordEventOutboxRetry'].includes(method))
     record(rel,sf,n,'outbox_operation',{operation:method,receiver:recv});
    if(method==='process' && /(?:^|\.)transport!?$/.test(recv))
     record(rel,sf,n,'durable_transport_process',{receiver:recv,journalReference:text(args[0])});
    if(['xadd','xread','xreadgroup','xack','xclaim','xautoclaim','xrange','xrevrange','publish','subscribe'].includes(method) &&
       /(?:redis|valkey|stream|client)/i.test(recv))
     record(rel,sf,n,'valkey_operation',{operation:method,stream:lit(args[0]),receiver:recv});
    if(/(?:record|claim|mark|publish|commit|settle|post|replay).*(?:Ledger|Outbox|Inbox|Settlement|Balance|DurableJob|Journal)/.test(method))
     record(rel,sf,n,'financial_command',{operation:method,receiver:recv,confidence:'INFERRED'});
    if(['add','addBulk','upsertJobScheduler'].includes(method)){
     const v=lookupVar(recv,n)||lookupVar(rootVar,n);
     if(v?.type==='Queue')
      record(rel,sf,n,'bull_enqueue',{queue:v.queue,queueCandidates:v.queueCandidates||[],
         prefixExpression:v.prefix||null,connectionExpression:v.connection||null,
         job:method==='add'?lit(args[0]):null,api:method,receiver:recv});
     else if(method==='add'&&recv==='queue'){
      const aliases=[];
      walk(sf,x=>{
       if(ts.isVariableDeclaration(x)&&text(x.name)===recv&&x.getStart(sf)<n.getStart(sf)&&
          nearest(x,ts.isMethodDeclaration)===nearest(n,ts.isMethodDeclaration))
        aliases.push({at:x.getStart(sf),expression:x.initializer?text(x.initializer):null});
      });
      aliases.sort((a,b)=>b.at-a.at);
      const expression=aliases[0]?.expression;
      if(expression&&/\bqueues\s*\[/.test(expression))
       record(rel,sf,n,'bull_enqueue',{queue:null,queueLookup:expression,
         job:lit(args[0]),api:method,receiver:recv,unresolved:'dynamic-queue-index'});
     }
    }
    if(callee.startsWith('this.')&&gatewayWrappers.has(method)){
     const cl=nearest(n,x=>ts.isClassDeclaration(x));
     const gateway=cl&&dec(cl,'WebSocketGateway');
     if(gateway){
      const namespace=lit(props(gateway.arguments.find(ts.isObjectLiteralExpression)).namespace)||'/';
      const event=arg0(n);
      if(typeof event==='string')
       record(rel,sf,n,'socket_emitter',{event,namespace,origin:null,
                    direction:'server_to_client',receiver:callee,confidence:'INFERRED'});
     }
    }
    if(['emit','on','once'].includes(method)){
     const v=lookupVar(recv,n)||lookupVar(rootVar,n);
     const ctx=nearest(n,x=>ts.isClassDeclaration(x));
     const isGateway=ctx&&!!dec(ctx,'WebSocketGateway');
     if(v?.type==='socket'||/^(?:io|socket|server|this\.server|this\.io|this\.socket)(?:\.|$)/.test(recv)){
      let namespace=v?.namespace||null,origin=v?.origin||null;
      if(isGateway){
       const g=dec(ctx,'WebSocketGateway');namespace=lit(props(g.arguments.find(ts.isObjectLiteralExpression)).namespace)||'/';
      }
      const manager=recv.endsWith('.io')&&v?.type==='socket';
      const direction=method==='emit'?(isGateway?'server_to_client':'client_to_server'):(isGateway?'client_to_server':'server_to_client');
      record(rel,sf,n,manager?'socket_manager_event':method==='emit'?'socket_emitter':'socket_listener',
             {event:lit(args[0]),namespace:manager?null:namespace,origin,direction,receiver:recv});
     }
    }
   }
  }
  if(ts.isJsxOpeningElement(n)||ts.isJsxSelfClosingElement(n)){
   const tag=text(n.tagName);
   if(/^[A-Z]/.test(tag)){
    const resolved=declarationTarget(n.tagName);
    const binding=imported.get(tag.split('.')[0])||'';
    const origin=binding.slice(0,binding.lastIndexOf(':'));
    const external=origin&&!origin.startsWith('.')&&!origin.startsWith('/')&&!origin.startsWith('@/');
    record(rel,sf,n,'react_renders',{component:tag,
      ...(external?{external_module:origin}:{}),...resolved});
   }
  }
 });
}
for(const p of input.paths||[])parseFile(p);
process.stdout.write(JSON.stringify(out));
