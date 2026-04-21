import React, { useDeferredValue, useEffect, useState, startTransition } from "https://esm.sh/react@18.3.1";
import { createRoot } from "https://esm.sh/react-dom@18.3.1/client";

const USERS_STORAGE_KEY = "northline-demo-users";
const SESSION_STORAGE_KEY = "northline-demo-session";
const POSTS_STORAGE_KEY = "northline-demo-posts";

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

function safeRead(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function safeWrite(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function readUsers() {
  return safeRead(USERS_STORAGE_KEY, []);
}

function saveUsers(users) {
  safeWrite(USERS_STORAGE_KEY, users);
}

function readSession() {
  return safeRead(SESSION_STORAGE_KEY, null);
}

function saveSession(user) {
  safeWrite(SESSION_STORAGE_KEY, user);
}

function clearSession() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

function readPosts() {
  return safeRead(POSTS_STORAGE_KEY, []);
}

function savePosts(posts) {
  safeWrite(POSTS_STORAGE_KEY, posts);
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
  strength
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
      React.createElement("button", { type: "submit", className: "primary-btn", disabled: pending }, pending ? "登录中..." : "立即登录")
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
      React.createElement("button", { type: "submit", className: "primary-btn", disabled: pending }, pending ? "创建中..." : "创建账户")
    ),
    React.createElement("div", { className: "footer-note" },
      React.createElement("p", { className: "subtle" }, "演示说明：当前版本将账号数据和留言保存在本浏览器的 localStorage 中，注册成功后会自动登录。")
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
  const myPosts = posts.filter((post) => post.authorEmail === session.email);

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
        React.createElement("p", { className: "subtle" }, "当前浏览器里的访客都可以看到这里的留言。")
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
                post.authorEmail === session.email && React.createElement("button", {
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
  const [status, setStatus] = useState({ type: "default", message: "正在检查登录状态..." });
  const [session, setSession] = useState(null);
  const [pending, setPending] = useState(false);
  const deferredPassword = useDeferredValue(registerData.password);
  const strength = strengthMeta(getPasswordStrength(deferredPassword));

  useEffect(() => {
    setPosts(readPosts());
    const savedSession = readSession();

    if (savedSession) {
      setSession(savedSession);
      setStatus({ type: "success", message: `已登录，欢迎回来，${savedSession.name}。` });
    } else {
      setStatus({ type: "warning", message: "当前未登录，你可以先注册一个演示账号。" });
    }
  }, []);

  function syncPosts(nextPosts) {
    const sortedPosts = [...nextPosts].sort((a, b) => b.createdAt - a.createdAt);
    savePosts(sortedPosts);
    setPosts(sortedPosts);
  }

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

  async function handleRegister(event) {
    event.preventDefault();
    setPending(true);

    try {
      const name = registerData.name.trim();
      const email = normalizeEmail(registerData.email);
      const password = registerData.password;
      const confirmPassword = registerData.confirmPassword;
      const users = readUsers();

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

      if (users.some((user) => user.email === email)) {
        throw new Error("该邮箱已被注册，请直接登录。");
      }

      const user = { name, email, password };
      saveUsers([...users, user]);

      const persistedUser = readUsers().find((entry) => entry.email === email);
      if (!persistedUser) {
        throw new Error("当前浏览器禁止了本地存储，注册信息没有成功保存。");
      }

      const safeUser = { name: user.name, email: user.email };
      saveSession(safeUser);
      setSession(safeUser);
      setRegisterData(INITIAL_REGISTER);
      setLoginData(INITIAL_LOGIN);
      setStatus({ type: "success", message: `注册成功，欢迎你，${user.name}。你已自动登录。` });
      changeMode("login", false);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
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
      const user = readUsers().find((entry) => entry.email === email && entry.password === password);

      if (!validateEmail(email)) {
        throw new Error("请输入有效的邮箱地址。");
      }

      if (!user) {
        throw new Error("邮箱或密码不正确，请重试。");
      }

      const safeUser = { name: user.name, email: user.email };
      saveSession(safeUser);
      setSession(safeUser);
      setLoginData(INITIAL_LOGIN);
      setStatus({ type: "success", message: `登录成功，欢迎回来，${user.name}。` });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setPending(false);
    }
  }

  function handleLogout() {
    setPending(true);

    try {
      clearSession();
      setSession(null);
      setStatus({ type: "default", message: "你已退出登录。" });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setPending(false);
    }
  }

  function handlePostSubmit(event) {
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

      const nextPosts = [
        {
          id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
          title,
          content,
          authorName: session.name,
          authorEmail: session.email,
          createdAt: Date.now()
        },
        ...posts
      ];

      syncPosts(nextPosts);
      setPostData(INITIAL_POST);
      setStatus({ type: "success", message: "留言发布成功，已经显示在留言板中。" });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  }

  function handleDeletePost(postId) {
    const nextPosts = posts.filter((post) => post.id !== postId);
    syncPosts(nextPosts);
    setStatus({ type: "default", message: "留言已删除。" });
  }

  return React.createElement("div", { className: `page-shell${session ? " authenticated" : ""}` },
    !session && React.createElement("section", { className: "brand-panel" },
      React.createElement("div", { className: "brand-copy" },
        React.createElement("p", { className: "eyebrow" }, "NORTHLINE"),
        React.createElement("h1", null, "把登录、主页和留言，连成一个小站。"),
        React.createElement("p", { className: "intro" }, "现在这个站点已经支持账号注册、登录、个人主页和本地持久化留言板。"),
        React.createElement("div", { className: "feature-list", "aria-label": "站点亮点" },
          React.createElement("div", null,
            React.createElement("span", null, "01"),
            React.createElement("p", null, "登录与注册流程保持原样，交互更完整。")
          ),
          React.createElement("div", null,
            React.createElement("span", null, "02"),
            React.createElement("p", null, "登录后会进入独立主页，而不是停留在表单卡片。")
          ),
          React.createElement("div", null,
            React.createElement("span", null, "03"),
            React.createElement("p", null, "留言板适合做课程作业里的互动模块。")
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
          strength
        })
    )
  );
}

createRoot(document.getElementById("root")).render(React.createElement(App));
