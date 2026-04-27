import React, { useDeferredValue, useEffect, useState, startTransition } from "https://esm.sh/react@18.3.1";
import { createRoot } from "https://esm.sh/react-dom@18.3.1/client";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.54.0";

const SUPABASE_CONFIG = window.__SUPABASE_CONFIG__ || {};
const RECENT_ACCOUNTS_STORAGE_KEY = "northline-recent-accounts";
const HAS_SUPABASE_CONFIG = Boolean(
  SUPABASE_CONFIG.url &&
  SUPABASE_CONFIG.anonKey &&
  !SUPABASE_CONFIG.url.includes("your-project") &&
  !SUPABASE_CONFIG.anonKey.includes("your-anon-key")
);

const supabase = HAS_SUPABASE_CONFIG
  ? createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

const INITIAL_REGISTER = {
  name: "",
  email: "",
  password: "",
  confirmPassword: ""
};

const INITIAL_LOGIN = {
  email: "",
  password: ""
};

const INITIAL_POST = {
  title: "",
  content: ""
};

function readRecentAccounts() {
  try {
    const raw = localStorage.getItem(RECENT_ACCOUNTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecentAccounts(accounts) {
  localStorage.setItem(RECENT_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
}

function rememberAccount(user) {
  const nextAccounts = [
    {
      email: user.email,
      name: user.name
    },
    ...readRecentAccounts().filter((account) => account.email !== user.email)
  ].slice(0, 5);

  saveRecentAccounts(nextAccounts);
  return nextAccounts;
}

function getPasswordStrength(password) {
  let score = 0;

  if (password.length >= 6) score += 1;
  if (/[A-Z]/.test(password) || /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  return score;
}

function strengthMeta(score) {
  return {
    widths: ["0%", "25%", "50%", "75%", "100%"][score],
    labels: ["等待输入", "偏弱", "一般", "良好", "很强"][score],
    colors: ["#b54848", "#b54848", "#b9832f", "#7a8f3f", "#2e7d57"][score]
  };
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function formatDate(timestamp) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(timestamp));
}

function mapSupabaseUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.user_metadata?.name || user.email?.split("@")[0] || "访客",
    email: user.email || ""
  };
}

async function getSupabaseSessionUser() {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return mapSupabaseUser(data.user);
}

async function loadSupabasePosts() {
  const { data, error } = await supabase
    .from("messages")
    .select("id,title,content,created_at,user_id,author_name,author_email")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []).map((post) => ({
    id: String(post.id),
    title: post.title,
    content: post.content,
    authorName: post.author_name,
    authorEmail: post.author_email,
    authorId: post.user_id,
    createdAt: new Date(post.created_at).getTime()
  }));
}

function PasswordInput({ id, value, placeholder, autoComplete, onChange }) {
  const [visible, setVisible] = useState(false);

  return (
    React.createElement("div", { className: "password-field" },
      React.createElement("input", {
        id,
        type: visible ? "text" : "password",
        value,
        placeholder,
        autoComplete,
        onChange
      }),
      React.createElement("button", {
        type: "button",
        className: "ghost-btn",
        onClick: () => setVisible((current) => !current)
      }, visible ? "隐藏" : "显示")
    )
  );
}

function AuthCard({
  mode,
  changeMode,
  status,
  pending,
  loginData,
  registerData,
  updateLogin,
  updateRegister,
  handleLogin,
  handleRegister,
  strength,
  recentAccounts,
  chooseRecentAccount
}) {
  return React.createElement("div", { className: "auth-card" },
    React.createElement("div", { className: "panel-header" },
      React.createElement("p", { className: "kicker" }, "ACCOUNT ACCESS"),
      React.createElement("div", { className: "mode-switch", role: "tablist", "aria-label": "登录与注册切换" },
        React.createElement("button", {
          className: `mode-btn${mode === "login" ? " active" : ""}`,
          type: "button",
          onClick: () => changeMode("login"),
          "aria-selected": mode === "login"
        }, "登录"),
        React.createElement("button", {
          className: `mode-btn${mode === "register" ? " active" : ""}`,
          type: "button",
          onClick: () => changeMode("register"),
          "aria-selected": mode === "register"
        }, "注册")
      )
    ),
    React.createElement("div", { className: `status-banner${status.type !== "default" ? ` ${status.type}` : ""}`, "aria-live": "polite" }, status.message),
    mode === "login" && React.createElement("form", { className: "auth-form", onSubmit: handleLogin },
      React.createElement("label", null,
        React.createElement("span", null, "邮箱"),
        React.createElement("input", {
          type: "email",
          value: loginData.email,
          placeholder: "name@example.com",
          autoComplete: "email",
          onChange: (event) => updateLogin("email", event.target.value)
        })
      ),
      React.createElement("label", null,
        React.createElement("span", null, "密码"),
        React.createElement(PasswordInput, {
          id: "loginPassword",
          value: loginData.password,
          placeholder: "请输入密码",
          autoComplete: "current-password",
          onChange: (event) => updateLogin("password", event.target.value)
        })
      ),
      React.createElement("button", { type: "submit", className: "primary-btn", disabled: pending || !HAS_SUPABASE_CONFIG }, pending ? "登录中..." : "立即登录"),
      recentAccounts.length > 0 && React.createElement("div", { className: "recent-panel" },
        React.createElement("p", { className: "kicker" }, "RECENT ACCOUNTS"),
        React.createElement("div", { className: "recent-list" },
          recentAccounts.map((account) => (
            React.createElement("button", {
              key: account.email,
              type: "button",
              className: "recent-account",
              onClick: () => chooseRecentAccount(account)
            },
              React.createElement("strong", null, account.name || "未命名用户"),
              React.createElement("span", null, account.email)
            )
          ))
        )
      )
    ),
    mode === "register" && React.createElement("form", { className: "auth-form", onSubmit: handleRegister },
      React.createElement("label", null,
        React.createElement("span", null, "用户名"),
        React.createElement("input", {
          type: "text",
          value: registerData.name,
          placeholder: "请输入昵称",
          autoComplete: "username",
          onChange: (event) => updateRegister("name", event.target.value)
        })
      ),
      React.createElement("label", null,
        React.createElement("span", null, "邮箱"),
        React.createElement("input", {
          type: "email",
          value: registerData.email,
          placeholder: "name@example.com",
          autoComplete: "email",
          onChange: (event) => updateRegister("email", event.target.value)
        })
      ),
      React.createElement("label", null,
        React.createElement("span", null, "密码"),
        React.createElement(PasswordInput, {
          id: "registerPassword",
          value: registerData.password,
          placeholder: "至少 6 位",
          autoComplete: "new-password",
          onChange: (event) => updateRegister("password", event.target.value)
        })
      ),
      React.createElement("label", null,
        React.createElement("span", null, "确认密码"),
        React.createElement(PasswordInput, {
          id: "confirmPassword",
          value: registerData.confirmPassword,
          placeholder: "再次输入密码",
          autoComplete: "new-password",
          onChange: (event) => updateRegister("confirmPassword", event.target.value)
        })
      ),
      React.createElement("div", { className: "password-meter", "aria-hidden": "true" },
        React.createElement("span", { style: { width: strength.widths, background: strength.colors } })
      ),
      React.createElement("p", { className: "hint" }, `密码强度：${strength.labels}`),
      React.createElement("button", { type: "submit", className: "primary-btn", disabled: pending || !HAS_SUPABASE_CONFIG }, pending ? "创建中..." : "创建账户")
    ),
    React.createElement("div", { className: "footer-note" },
      React.createElement("p", { className: "subtle" }, "当前分支只支持 Supabase 数据库模式。请先完成 `app-config.js` 配置再继续。")
    )
  );
}

function HomeView({
  session,
  status,
  posts,
  postData,
  updatePost,
  handlePostSubmit,
  handleDeletePost,
  handleLogout,
  pending
}) {
  const myPosts = posts.filter((post) => post.authorId === session.id);

  return React.createElement("div", { className: "home-shell" },
    React.createElement("section", { className: "hero-panel" },
      React.createElement("div", { className: "hero-copy" },
        React.createElement("p", { className: "eyebrow" }, "MEMBER HOME"),
        React.createElement("h1", null, `欢迎回来，${session.name}`),
        React.createElement("p", { className: "intro" }, "这里是你的主页。你可以查看账号信息、发布留言，也可以看看大家最近都写了什么。")
      ),
      React.createElement("div", { className: "hero-meta" },
        React.createElement("div", { className: "meta-strip" },
          React.createElement("span", null, "当前账号"),
          React.createElement("strong", null, session.email)
        ),
        React.createElement("div", { className: "meta-strip" },
          React.createElement("span", null, "数据来源"),
          React.createElement("strong", null, "Supabase 数据库")
        ),
        React.createElement("button", {
          type: "button",
          className: "secondary-btn",
          onClick: handleLogout,
          disabled: pending
        }, pending ? "处理中..." : "退出登录")
      )
    ),
    React.createElement("div", { className: `status-banner${status.type !== "default" ? ` ${status.type}` : ""}`, "aria-live": "polite" }, status.message),
    React.createElement("section", { className: "dashboard-grid" },
      React.createElement("article", { className: "info-panel" },
        React.createElement("p", { className: "kicker" }, "PROFILE"),
        React.createElement("h2", null, "个人主页"),
        React.createElement("div", { className: "profile-list" },
          React.createElement("div", null,
            React.createElement("span", null, "昵称"),
            React.createElement("strong", null, session.name)
          ),
          React.createElement("div", null,
            React.createElement("span", null, "邮箱"),
            React.createElement("strong", null, session.email)
          ),
          React.createElement("div", null,
            React.createElement("span", null, "我的留言"),
            React.createElement("strong", null, `${myPosts.length} 条`)
          ),
          React.createElement("div", null,
            React.createElement("span", null, "站内总留言"),
            React.createElement("strong", null, `${posts.length} 条`)
          )
        )
      ),
      React.createElement("article", { className: "composer-panel" },
        React.createElement("p", { className: "kicker" }, "MESSAGE BOARD"),
        React.createElement("h2", null, "发布留言"),
        React.createElement("form", { className: "post-form", onSubmit: handlePostSubmit },
          React.createElement("label", null,
            React.createElement("span", null, "标题"),
            React.createElement("input", {
              type: "text",
              value: postData.title,
              placeholder: "例如：今天的学习进度",
              onChange: (event) => updatePost("title", event.target.value)
            })
          ),
          React.createElement("label", null,
            React.createElement("span", null, "内容"),
            React.createElement("textarea", {
              rows: 5,
              value: postData.content,
              placeholder: "写点想法、记录或给访客的留言吧。",
              onChange: (event) => updatePost("content", event.target.value)
            })
          ),
          React.createElement("button", { type: "submit", className: "primary-btn" }, "发布留言")
        )
      )
    ),
    React.createElement("section", { className: "board-panel" },
      React.createElement("div", { className: "board-header" },
        React.createElement("div", null,
          React.createElement("p", { className: "kicker" }, "LIVE POSTS"),
          React.createElement("h2", null, "留言板")
        ),
        React.createElement("p", { className: "subtle" }, "所有数据都通过 Supabase 读写，适合正常的 GitHub + Vercel 工作流。")
      ),
      posts.length === 0
        ? React.createElement("div", { className: "empty-state" }, "还没有留言，发第一条吧。")
        : React.createElement("div", { className: "post-list" },
          posts.map((post) => (
            React.createElement("article", { key: post.id, className: "post-item" },
              React.createElement("div", { className: "post-top" },
                React.createElement("div", null,
                  React.createElement("h3", null, post.title),
                  React.createElement("p", { className: "post-meta" }, `${post.authorName} · ${formatDate(post.createdAt)}`)
                ),
                (post.authorId === session.id) &&
                  React.createElement("button", {
                    type: "button",
                    className: "text-btn",
                    onClick: () => handleDeletePost(post.id)
                  }, "删除")
              ),
              React.createElement("p", { className: "post-content" }, post.content)
            )
          ))
        )
    )
  );
}

function App() {
  const [mode, setMode] = useState("login");
  const [loginData, setLoginData] = useState(INITIAL_LOGIN);
  const [registerData, setRegisterData] = useState(INITIAL_REGISTER);
  const [postData, setPostData] = useState(INITIAL_POST);
  const [posts, setPosts] = useState([]);
  const [recentAccounts, setRecentAccounts] = useState([]);
  const [status, setStatus] = useState({
    type: HAS_SUPABASE_CONFIG ? "default" : "error",
    message: HAS_SUPABASE_CONFIG
      ? "正在检查登录状态..."
      : "当前分支只支持 Supabase。请先在 `app-config.js` 中填写项目 URL 和 anon key。"
  });
  const [session, setSession] = useState(null);
  const [pending, setPending] = useState(false);
  const deferredPassword = useDeferredValue(registerData.password);
  const strength = strengthMeta(getPasswordStrength(deferredPassword));

  async function refreshPosts() {
    setPosts(await loadSupabasePosts());
  }

  useEffect(() => {
    if (!HAS_SUPABASE_CONFIG) {
      return undefined;
    }

    let active = true;

    async function bootstrap() {
      try {
        setRecentAccounts(readRecentAccounts());
        await refreshPosts();
        const currentUser = await getSupabaseSessionUser();

        if (!active) {
          return;
        }

        if (currentUser) {
          setSession(currentUser);
          setStatus({ type: "success", message: `已登录，欢迎回来，${currentUser.name}。` });
        } else {
          setStatus({ type: "warning", message: "当前未登录，请使用数据库账号登录。" });
        }
      } catch (error) {
        if (active) {
          setStatus({ type: "error", message: error.message || "初始化失败，请检查 Supabase 配置。" });
        }
      }
    }

    bootstrap();

    const authListener = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      if (!active) {
        return;
      }

      const mappedUser = mapSupabaseUser(currentSession?.user || null);
      setSession(mappedUser);

      if (!mappedUser) {
        setStatus({ type: "default", message: "你已退出登录。" });
      }
    });

    return () => {
      active = false;
      authListener.data.subscription.unsubscribe();
    };
  }, []);

  function changeMode(nextMode, resetStatus = true) {
    startTransition(() => {
      setMode(nextMode);
      if (resetStatus) {
        setStatus({
          type: "default",
          message: nextMode === "login" ? "请输入账号信息。" : "请填写信息完成注册。"
        });
      }
    });
  }

  function updateLogin(field, value) {
    setLoginData((current) => ({ ...current, [field]: value }));
  }

  function updateRegister(field, value) {
    setRegisterData((current) => ({ ...current, [field]: value }));
  }

  function updatePost(field, value) {
    setPostData((current) => ({ ...current, [field]: value }));
  }

  function chooseRecentAccount(account) {
    setLoginData((current) => ({
      ...current,
      email: account.email
    }));
    setMode("login");
    setStatus({ type: "default", message: `已填入 ${account.email}，请输入密码继续登录。` });
  }

  async function handleRegister(event) {
    event.preventDefault();
    setPending(true);

    try {
      const name = registerData.name.trim();
      const email = normalizeEmail(registerData.email);
      const password = registerData.password;
      const confirmPassword = registerData.confirmPassword;

      if (!name) {
        throw new Error("请输入用户名。");
      }

      if (!validateEmail(email)) {
        throw new Error("请输入有效的邮箱地址。");
      }

      if (password.length < 6) {
        throw new Error("密码长度至少需要 6 位。");
      }

      if (password !== confirmPassword) {
        throw new Error("两次输入的密码不一致。");
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        const currentUser = mapSupabaseUser(data.session.user);
        setRecentAccounts(rememberAccount(currentUser));
        setSession(currentUser);
        await refreshPosts();
        setStatus({ type: "success", message: `注册成功，欢迎你，${currentUser.name}。你已自动登录。` });
      } else {
        setStatus({ type: "success", message: "注册成功。若 Supabase 开启了邮箱确认，请先验证邮箱后再登录。" });
      }

      setRegisterData(INITIAL_REGISTER);
      setLoginData(INITIAL_LOGIN);
      changeMode("login", false);
    } catch (error) {
      setStatus({ type: "error", message: error.message || "注册失败，请检查 Supabase 配置。" });
    } finally {
      setPending(false);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setPending(true);

    try {
      const email = normalizeEmail(loginData.email);
      const password = loginData.password;

      if (!validateEmail(email)) {
        throw new Error("请输入有效的邮箱地址。");
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        throw error;
      }

      const currentUser = mapSupabaseUser(data.user);
      setRecentAccounts(rememberAccount(currentUser));
      setSession(currentUser);
      await refreshPosts();
      setStatus({ type: "success", message: `登录成功，欢迎回来，${currentUser.name}。` });
      setLoginData(INITIAL_LOGIN);
    } catch (error) {
      setStatus({ type: "error", message: error.message || "登录失败，请检查 Supabase 配置。" });
    } finally {
      setPending(false);
    }
  }

  async function handleLogout() {
    setPending(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      setStatus({ type: "default", message: "你已退出登录。" });
    } catch (error) {
      setStatus({ type: "error", message: error.message || "退出登录失败。" });
    } finally {
      setPending(false);
    }
  }

  async function handlePostSubmit(event) {
    event.preventDefault();

    try {
      const title = postData.title.trim();
      const content = postData.content.trim();

      if (!title) {
        throw new Error("请先填写留言标题。");
      }

      if (!content) {
        throw new Error("请先填写留言内容。");
      }

      const { error } = await supabase.from("messages").insert({
        title,
        content,
        user_id: session.id,
        author_name: session.name,
        author_email: session.email
      });

      if (error) {
        throw error;
      }

      await refreshPosts();
      setPostData(INITIAL_POST);
      setStatus({ type: "success", message: "留言发布成功，已经显示在留言板中。" });
    } catch (error) {
      setStatus({ type: "error", message: error.message || "留言发布失败。" });
    }
  }

  async function handleDeletePost(postId) {
    try {
      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("id", postId)
        .eq("user_id", session.id);

      if (error) {
        throw error;
      }

      await refreshPosts();
      setStatus({ type: "default", message: "留言已删除。" });
    } catch (error) {
      setStatus({ type: "error", message: error.message || "删除留言失败。" });
    }
  }

  return React.createElement("div", { className: `page-shell${session ? " authenticated" : ""}` },
    !session && React.createElement("section", { className: "brand-panel" },
      React.createElement("div", { className: "brand-copy" },
        React.createElement("p", { className: "eyebrow" }, "NORTHLINE"),
        React.createElement("h1", null, "把登录、主页和留言，连成一个真正带数据库的小站。"),
        React.createElement("p", { className: "intro" }, "这个分支只保留 Supabase 正式路径，去掉了本地演示回退逻辑，更适合 GitHub + Vercel 持续更新。"),
        React.createElement("div", { className: "feature-list", "aria-label": "站点亮点" },
          React.createElement("div", null,
            React.createElement("span", null, "01"),
            React.createElement("p", null, "Supabase Auth 负责注册和登录，不再保留浏览器本地账号逻辑。")
          ),
          React.createElement("div", null,
            React.createElement("span", null, "02"),
            React.createElement("p", null, "留言通过 `messages` 表持久化，多设备能看到同一批内容。")
          ),
          React.createElement("div", null,
            React.createElement("span", null, "03"),
            React.createElement("p", null, "没配数据库时会直接报配置缺失，不再偷偷走本地模式。")
          )
        )
      )
    ),
    React.createElement("section", { className: "auth-panel" },
      session
        ? React.createElement(HomeView, {
            session,
            status,
            posts,
            postData,
            updatePost,
            handlePostSubmit,
            handleDeletePost,
            handleLogout,
            pending
          })
        : React.createElement(AuthCard, {
            mode,
            changeMode,
            status,
            pending,
            loginData,
            registerData,
            updateLogin,
            updateRegister,
            handleLogin,
            handleRegister,
            strength,
            recentAccounts,
            chooseRecentAccount
          })
    )
  );
}

createRoot(document.getElementById("root")).render(React.createElement(App));
