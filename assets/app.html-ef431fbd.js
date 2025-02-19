import{_ as n,o as s,c as a,a as e}from"./app-aa72e212.js";const p={},t=e(`<h1 id="应用" tabindex="-1"><a class="header-anchor" href="#应用" aria-hidden="true">#</a> 应用</h1><p>一个应用即是一个继承 App 的类。</p><h2 id="配置应用" tabindex="-1"><a class="header-anchor" href="#配置应用" aria-hidden="true">#</a> 配置应用</h2><p>通过覆盖 App 类上的配置属性值来自定义应用，同时，应用还提供多个生命周期以供扩展。完整的应用配置选项可以参考 <code>IAppConfig</code>。</p><div class="language-typescript line-numbers-mode" data-ext="ts"><pre class="language-typescript"><code><span class="token keyword">import</span> <span class="token punctuation">{</span> App<span class="token punctuation">,</span> IAppConfig <span class="token punctuation">}</span> <span class="token keyword">from</span> <span class="token string">&#39;bwcx-ljsm&#39;</span><span class="token punctuation">;</span>

<span class="token keyword">class</span> <span class="token class-name">OurApp</span> <span class="token keyword">extends</span> <span class="token class-name">App</span> <span class="token punctuation">{</span>
  <span class="token comment">// 应用根目录</span>
  <span class="token keyword">protected</span> baseDir <span class="token operator">=</span> __dirname<span class="token punctuation">;</span>

  <span class="token comment">// 需要被容器扫描和装配的文件 glob（基于 \`baseDir\`，具体概念请参考依赖注入章节）</span>
  <span class="token keyword">protected</span> scanGlobs <span class="token operator">=</span> <span class="token punctuation">[</span>
    <span class="token string">&#39;./**/*.(j|t)s&#39;</span><span class="token punctuation">,</span>
    <span class="token string">&#39;!./**/*.d.ts&#39;</span><span class="token punctuation">,</span>
  <span class="token punctuation">]</span><span class="token punctuation">;</span>

  <span class="token comment">// 监听端口</span>
  <span class="token keyword">protected</span> port <span class="token operator">=</span> <span class="token number">3000</span><span class="token punctuation">;</span>

  <span class="token comment">// 监听 hostname</span>
  <span class="token keyword">protected</span> hostname<span class="token punctuation">;</span>

  <span class="token comment">// 退出超时时间</span>
  <span class="token keyword">protected</span> exitTimeout <span class="token operator">=</span> <span class="token number">5000</span><span class="token punctuation">;</span>

  <span class="token comment">// 要加载的插件</span>
  <span class="token keyword">protected</span> plugins <span class="token operator">=</span> <span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token punctuation">;</span>

  <span class="token comment">// 要加载的全局中间件</span>
  <span class="token keyword">protected</span> globalMiddlewares <span class="token operator">=</span> <span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token punctuation">;</span>

  <span class="token comment">// 要加载的全局守卫</span>
  <span class="token keyword">protected</span> globalGuards <span class="token operator">=</span> <span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token punctuation">;</span>

  <span class="token comment">// 默认响应处理器</span>
  <span class="token keyword">protected</span> responseHandler<span class="token operator">:</span> IAppConfig<span class="token punctuation">[</span><span class="token string">&quot;responseHandler&quot;</span><span class="token punctuation">]</span><span class="token punctuation">;</span>

  <span class="token comment">// 数据校验选项</span>
  <span class="token keyword">protected</span> validation<span class="token operator">:</span> IAppConfig<span class="token punctuation">[</span><span class="token string">&quot;validation&quot;</span><span class="token punctuation">]</span> <span class="token operator">=</span> <span class="token punctuation">{</span><span class="token punctuation">}</span><span class="token punctuation">;</span>

  <span class="token comment">// 应用初始化前</span>
  <span class="token keyword">async</span> <span class="token function">beforeInit</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span><span class="token punctuation">}</span>

  <span class="token comment">// 应用装配前</span>
  <span class="token keyword">async</span> <span class="token function">beforeWire</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span><span class="token punctuation">}</span>

  <span class="token comment">// 应用装配完成后</span>
  <span class="token keyword">async</span> <span class="token function">afterWire</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span><span class="token punctuation">}</span>

  <span class="token comment">// 应用启动前</span>
  <span class="token keyword">async</span> <span class="token function">beforeStart</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span><span class="token punctuation">}</span>

  <span class="token comment">// 应用成功启动后</span>
  <span class="token keyword">async</span> <span class="token function">afterStart</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span><span class="token punctuation">}</span>

  <span class="token comment">// 应用退出前</span>
  <span class="token keyword">async</span> <span class="token function">beforeExit</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span><span class="token punctuation">}</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="引导应用" tabindex="-1"><a class="header-anchor" href="#引导应用" aria-hidden="true">#</a> 引导应用</h2><p>对于一个实例化的应用对象，调用 <code>bootstrap()</code> 以启动引导，应用将自动完成初始化、插件激活、路由装配等流程。所有围绕 <code>init</code> 和 <code>wire</code> 的生命周期钩子均会被执行。</p><p>大多数情况下，你可能会将 Controller 和其他业务逻辑放置在和 App 不同的模块中以更好地组织代码，这时需要先执行依赖扫描（<code>app.scan()</code>）以保证引导时所有依赖都已备妥。</p><div class="language-typescript line-numbers-mode" data-ext="ts"><pre class="language-typescript"><code><span class="token keyword">const</span> app <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">OurApp</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
app<span class="token punctuation">.</span><span class="token function">scan</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
app<span class="token punctuation">.</span><span class="token function">bootstrap</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// 注意，这是一个异步操作，其会返回应用装配数据</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="启动应用" tabindex="-1"><a class="header-anchor" href="#启动应用" aria-hidden="true">#</a> 启动应用</h2><p>对于已完成引导的应用，调用 <code>start()</code> 以启动服务器，所有围绕 <code>start</code> 的生命周期钩子均会被执行。另外，在服务器接收到非强制退出信号时，<code>beforeExit</code> 钩子会被执行，可以在此进行一些清理工作。其最长等待时间由 <code>exitTimeout</code> 配置项决定。</p><div class="language-typescript line-numbers-mode" data-ext="ts"><pre class="language-typescript"><code>app<span class="token punctuation">.</span><span class="token function">start</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// 这也是一个异步操作，会返回已监听的 http.Server 对象</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><div class="custom-container tip"><p class="custom-container-title">TIP</p><p>尚不支持多应用，每个进程仅可存在一个被引导的应用。</p></div><h2 id="停止应用" tabindex="-1"><a class="header-anchor" href="#停止应用" aria-hidden="true">#</a> 停止应用</h2><p>你可以手动停止已启动应用，这将会关闭所有连接并关闭监听。</p><div class="language-typescript line-numbers-mode" data-ext="ts"><pre class="language-typescript"><code>app<span class="token punctuation">.</span><span class="token function">stop</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// 这还是一个异步操作</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><h2 id="清理应用" tabindex="-1"><a class="header-anchor" href="#清理应用" aria-hidden="true">#</a> 清理应用</h2><p>在某些时候，你可能要清理 app 实例在装配和启动中带来的副作用（如注册的进程退出钩子），在确保应用已停止后即可执行清理，这对诸如服务端 HMR 等场景可能会有用。需要注意的是，这个操作并不会清理已扫描的依赖，如需重置容器，请使用 <code>resetContainer()</code>。</p><div class="language-typescript line-numbers-mode" data-ext="ts"><pre class="language-typescript"><code>app<span class="token punctuation">.</span><span class="token function">clear</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div>`,19),c=[t];function o(i,l){return s(),a("div",null,c)}const d=n(p,[["render",o],["__file","app.html.vue"]]);export{d as default};
