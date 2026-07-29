const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const LOGO_MOUNTAIN_PATH = "M12 134 L58 58 Q64 48 74 58 Q96 82 111 75 Q127 68 142 43 L168 8 Q172 2 177 12 L218 98 Q225 113 235 108 Q245 104 250 119 L258 139";

const state = {
  data: null,
  route: "home",
  department: null,
  projectFilter: "all",
  alumniView: "timeline",
  qrType: "recruit"
};

const app = {
  async init() {
    const response = await fetch("./data/site-data.json");
    state.data = await response.json();
    this.applyCanonicalLogo();
    this.setupIntro();
    this.renderMetrics();
    this.renderDepartments();
    this.renderProjects();
    this.renderAlumni();
    this.renderAnnuals();
    this.renderJoin();
    this.bindNavigation();
    this.bindTheme();
    this.bindScrollEffects();
    this.bindModals();
    this.bindClueMagnifier();
    particleLogo.init();
    projectRipple.init();
    this.routeFromHash(false);
  },

  applyCanonicalLogo() {
    $$(".intro-mountain, .brand svg path:first-child, .network-center svg path:first-child, .about-mark svg path").forEach((path) => {
      path.setAttribute("d", LOGO_MOUNTAIN_PATH);
    });
  },

  setupIntro() {
    const intro = $("#intro");
    const percent = $("#introPercent");
    const started = performance.now();
    const tick = (now) => {
      const value = Math.min(100, Math.round((now - started) / 20));
      percent.textContent = `${value}%`;
      if (value < 100) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    setTimeout(() => intro.classList.add("is-done"), 2250);
  },

  renderMetrics() {
    $("#metricGrid").innerHTML = state.data.metrics.map((metric) => `
      <article class="metric">
        <strong data-count="${metric.value}">0<small>${metric.suffix}</small></strong>
        <p>${metric.label}</p>
      </article>`).join("");
  },

  renderDepartments() {
    const lines = [];
    const nodes = [];
    const root = { x: 78, y: 280 };
    state.data.departments.forEach((dept, index) => {
      const x = dept.x / 100 * 760;
      const y = dept.y / 100 * 560;
      lines.push(`<path class="department-link" data-line-department="${dept.id}" d="M${root.x} ${root.y} C150 ${root.y}, 180 ${y}, ${x} ${y}"></path>`);
      nodes.push(`
        <button class="department-node" data-department="${dept.id}" data-index="${index}" style="left:${dept.x}%;top:${dept.y}%">
          <span>${dept.name}<small>${dept.code}${dept.subteams?.length ? ` · ${dept.subteams.length} GROUPS` : ""}</small></span>
        </button>`);
      dept.subteams?.forEach((team, teamIndex) => {
        const teamX = team.x / 100 * 760;
        const teamY = team.y / 100 * 560;
        lines.push(`<path class="subteam-link" data-line-department="${dept.id}" data-line-subteam="${team.id}" d="M${x} ${y} C${x + 70} ${y}, ${teamX - 90} ${teamY}, ${teamX} ${teamY}"></path>`);
        nodes.push(`
          <button class="subteam-node" data-department="${dept.id}" data-subteam="${team.id}" data-index="${index}" style="left:${team.x}%;top:${team.y}%">
            <span>${team.name}<small>${String(teamIndex + 1).padStart(2, "0")}</small></span>
          </button>`);
      });
    });
    $("#networkLineGroup").innerHTML = lines.join("");
    $("#departmentNodes").innerHTML = nodes.join("");
    $("#departmentTree").innerHTML = state.data.departments.map((dept, index) => `
      <article class="tree-department" data-tree-department="${dept.id}">
        <button class="tree-department-button" data-department="${dept.id}" data-index="${index}">
          <span><small>0${index + 1}</small><b>${dept.name}</b></span><i>${dept.subteams?.length ? "+" : "→"}</i>
        </button>
        ${dept.subteams?.length ? `<div class="tree-subteams">${dept.subteams.map((team) => `
          <button data-department="${dept.id}" data-subteam="${team.id}" data-index="${index}"><span>${team.name}</span><small>${team.code}</small></button>`).join("")}</div>` : ""}
      </article>`).join("");
    $$(".department-node, .subteam-node, .tree-department-button, .tree-subteams button").forEach((button) => {
      const select = () => this.selectDepartment(button.dataset.department, Number(button.dataset.index), button.dataset.subteam);
      if (!button.classList.contains("tree-department-button")) button.addEventListener("mouseenter", select);
      button.addEventListener("focus", select);
      button.addEventListener("click", select);
    });
    this.selectDepartment("product", 0);
  },

  selectDepartment(id, index, subteamId = "") {
    state.department = id;
    const dept = state.data.departments.find((item) => item.id === id);
    const team = dept.subteams?.find((item) => item.id === subteamId);
    $$(".department-node").forEach((node) => node.classList.toggle("is-active", node.dataset.department === id));
    $$(".subteam-node").forEach((node) => {
      node.classList.toggle("is-related", node.dataset.department === id);
      node.classList.toggle("is-active", node.dataset.subteam === subteamId);
    });
    $$(".network-lines path").forEach((line) => {
      const sameDepartment = line.dataset.lineDepartment === id;
      const sameTeam = !line.dataset.lineSubteam || line.dataset.lineSubteam === subteamId;
      line.classList.toggle("is-active", sameDepartment && (subteamId ? sameTeam : true));
    });
    $$(".tree-department").forEach((item) => item.classList.toggle("is-open", item.dataset.treeDepartment === id));
    $$(".tree-subteams button").forEach((button) => button.classList.toggle("is-active", button.dataset.subteam === subteamId));
    const title = team?.name ?? dept.name;
    const code = team?.code ?? dept.code;
    const description = team?.description ?? dept.description;
    const tech = team?.tech ?? dept.tech;
    $("#departmentDetail").innerHTML = `
      <span class="dept-code">DEPARTMENT 0${index + 1} / ${code}</span>
      <h3>${title}</h3>
      <p>${description}</p>
      <div class="tech-tags">${tech.map((item) => `<span>${item}</span>`).join("")}</div>
      ${dept.subteams?.length && !team ? `<div class="subteam-list"><small>下设组别 · 点击拓扑节点查看方向</small>${dept.subteams.map((item) => `<button data-detail-subteam="${item.id}"><b>${item.name}</b><span>${item.description}</span></button>`).join("")}</div>` : ""}
      ${team ? `<button class="detail-back" data-detail-department="${dept.id}">← 返回${dept.name}总览</button>` : ""}
      <div class="dept-members"><small>${dept.lead}</small><p>${dept.members.join(" · ")}</p></div>`;
    $$("[data-detail-subteam]").forEach((button) => button.addEventListener("click", () => this.selectDepartment(id, index, button.dataset.detailSubteam)));
    $("[data-detail-department]")?.addEventListener("click", () => this.selectDepartment(id, index));
    this.syncClueMagnifier();
  },

  bindClueMagnifier() {
    const panel = $("#networkPanel");
    const lens = $("#clueMagnifier");
    const move = (event) => {
      if (innerWidth <= 600) return;
      const rect = panel.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const zoom = 1.48;
      const radius = lens.offsetWidth / 2;
      lens.style.left = `${x}px`;
      lens.style.top = `${y}px`;
      const clone = $("#clueMagnifierScene").firstElementChild;
      if (clone) clone.style.transform = `translate(${radius - x * zoom}px,${radius - y * zoom}px) scale(${zoom})`;
    };
    panel.addEventListener("pointerenter", (event) => {
      this.syncClueMagnifier();
      lens.classList.add("is-visible");
      move(event);
    });
    panel.addEventListener("pointermove", move);
    panel.addEventListener("pointerleave", () => lens.classList.remove("is-visible"));
    window.addEventListener("resize", () => this.syncClueMagnifier());
  },

  syncClueMagnifier() {
    const panel = $("#networkPanel");
    const scene = $("#clueBoardScene");
    const target = $("#clueMagnifierScene");
    if (!panel || !scene || !target || !panel.clientWidth) return;
    const clone = scene.cloneNode(true);
    clone.removeAttribute("id");
    clone.querySelectorAll("[id]").forEach((element) => element.removeAttribute("id"));
    clone.style.width = `${panel.clientWidth}px`;
    clone.style.height = `${panel.clientHeight}px`;
    target.replaceChildren(clone);
  },

  renderProjects() {
    const projects = state.data.projects.filter((project) => state.projectFilter === "all" || project.status === state.projectFilter);
    $("#projectCount").textContent = String(projects.length).padStart(2, "0");
    const mobile = innerWidth < 600;
    const compact = innerWidth < 920;
    const baseX = mobile ? 50 : compact ? 52 : 64;
    const positions = projects.map((_, index) => {
      const angle = -Math.PI / 2 + index / Math.max(projects.length, 1) * Math.PI * 2;
      const radiusX = mobile ? 35 : compact ? 34 : 22 + (index % 2) * 2;
      const radiusY = mobile ? 17 : 27 + (index % 2) * 4;
      return { x: baseX + Math.cos(angle) * radiusX, y: (mobile ? 68 : 56) + Math.sin(angle) * radiusY };
    });
    $("#projectGrid").innerHTML = projects.map((project, index) => `
      <button class="project-coordinate" data-project-coordinate="${project.id}" style="--x:${positions[index].x}%;--y:${positions[index].y}%;--delay:${.62 + index * .1}s" aria-label="查看${project.name}">
        <b>${project.glyph}</b><span>${project.name}</span>
      </button>`).join("");
    $$("[data-project-coordinate]").forEach((marker) => {
      marker.addEventListener("click", () => this.showProjectCoordinate(marker.dataset.projectCoordinate));
    });
    $("#projectFloatCard").classList.remove("is-visible");
  },

  showProjectCoordinate(id) {
    const project = state.data.projects.find((item) => item.id === id);
    $$("[data-project-coordinate]").forEach((marker) => marker.classList.toggle("is-active", marker.dataset.projectCoordinate === id));
    $("#projectFloatCard").innerHTML = `
      <button class="float-card-close" aria-label="关闭项目介绍">×</button>
      <small>${project.statusLabel.toUpperCase()} / ${project.year}</small>
      <h2>${project.name}</h2>
      <p>${project.description}</p>
      <div class="project-float-meta">
        <span>项目状态<b>${project.statusLabel}</b></span>
        <span>参与部门<b>${project.owner}</b></span>
      </div>
      <div class="project-tags">${project.tech.map((tech) => `<span>${tech}</span>`).join("")}</div>`;
    $("#projectFloatCard").classList.add("is-visible");
    $(".float-card-close").addEventListener("click", () => {
      $("#projectFloatCard").classList.remove("is-visible");
      $$("[data-project-coordinate]").forEach((marker) => marker.classList.remove("is-active"));
    });
    projectRipple.pulse();
  },

  openProject(id) {
    const project = state.data.projects.find((item) => item.id === id);
    const background = project.caseStudy?.background ?? project.description;
    const solution = project.caseStudy?.solution ?? project.summary;
    const impact = project.caseStudy?.impact ?? "成果数据与真实使用反馈将在项目资料确认后补充。";
    $("#projectModalContent").innerHTML = `
      <div class="modal-project-hero" style="--project-bg:${project.bg}">
        <p>${project.statusLabel.toUpperCase()} / ${project.year}</p><h2>${project.name}</h2><span>${project.summary}</span>
      </div>
      <div class="modal-project-body">
        <div class="case-study-grid">
          <article><small>01 / BACKGROUND</small><h3>项目背景</h3><p>${background}</p></article>
          <article><small>02 / SOLUTION</small><h3>解决方案</h3><p>${solution}</p></article>
          <article><small>03 / IMPACT</small><h3>成果数据</h3><p>${impact}</p></article>
          <article><small>04 / TEAM</small><h3>参与部门</h3><p>${project.owner}</p></article>
        </div>
        <div class="project-tags">${project.tech.map((tech) => `<span>${tech}</span>`).join("")}</div>
        <div class="modal-grid"><div><small>项目周期</small>${project.year}</div><div><small>项目状态</small>${project.statusLabel}</div><div><small>负责方向</small>${project.owner}</div><div><small>项目链接</small>原型阶段暂未开放</div></div>
      </div>`;
    $("#projectModal").showModal();
  },

  renderAlumni() {
    const grouped = state.data.alumni.reduce((result, person) => {
      (result[person.year] ??= []).push(person);
      return result;
    }, {});
    $("#timelinePanel").innerHTML = Object.keys(grouped).sort((a, b) => b - a).map((year) => `
      <section class="timeline-year">
        <h2>${year}</h2>
        <div class="timeline-items">${grouped[year].map((person) => `
          <article class="alumni-card"><small>${person.city} / ${person.role}</small><h3>${person.name}</h3><p>${person.company}</p><p class="alumni-quote">“${person.quote}”</p></article>`).join("")}
        </div>
      </section>`).join("");
    $("#cityMarkers").innerHTML = state.data.cities.map((city) => {
      const size = Math.max(8, state.data.alumni.filter((person) => person.city === city.name).length * 4 + 6);
      return `<g class="city-marker" data-city="${city.name}" tabindex="0"><circle cx="${city.x}" cy="${city.y}" r="${size}"></circle><text x="${city.x + 15}" y="${city.y + 4}">${city.name}</text></g>`;
    }).join("");
    $$(".city-marker").forEach((marker) => {
      const select = () => this.selectCity(marker.dataset.city);
      marker.addEventListener("click", select);
      marker.addEventListener("keydown", (event) => event.key === "Enter" && select());
    });
  },

  selectCity(cityName) {
    $$(".city-marker").forEach((marker) => marker.classList.toggle("is-active", marker.dataset.city === cityName));
    const people = state.data.alumni.filter((person) => person.city === cityName);
    $("#mapDetail").innerHTML = `
      <p>${cityName.toUpperCase()} / ${String(people.length).padStart(2, "0")} ALUMNI</p>
      <h3>${cityName}</h3>
      <span>从蓝山出发，在这里继续创造。</span>
      <div>${people.map((person) => `<div class="map-person"><strong>${person.name}</strong><small>${person.company} · ${person.role}</small></div>`).join("")}</div>`;
  },

  renderAnnuals() {
    $("#annualTrack").innerHTML = state.data.annuals.map((annual) => `
      <article class="annual-card" style="--cover:${annual.cover}">
        <small>LANSHAN ANNUAL</small><span>↗</span><h3>${annual.year}<br>${annual.title}</h3><p>${annual.subtitle}</p>
      </article>`).join("");
  },

  renderJoin() {
    $("#requirementsGrid").innerHTML = state.data.departments.map((dept, index) => `
      <article class="requirement-card"><span>DEPARTMENT 0${index + 1} / ${dept.code}</span><h3>${dept.name}</h3><p>${dept.description}</p>${dept.subteams?.length ? `<div class="requirement-subteams">${dept.subteams.map((team) => `<b>${team.name}</b>`).join("")}</div>` : ""}<div class="tech-tags">${dept.tech.slice(0,3).map((tech) => `<span>${tech}</span>`).join("")}</div></article>`).join("");
    this.renderQrCards();
    this.updateCountdown();
    setInterval(() => this.updateCountdown(), 1000);
  },

  renderQrCards() {
    const isStudy = state.qrType === "study";
    $("#qrGrid").innerHTML = state.data.departments.map((dept) => `
      <article class="qr-card" data-qr="${dept.name}" data-qr-label="${isStudy ? "飞书学习群" : "招新群"}"><div class="fake-qr"></div><div><h3>${dept.name}</h3><p>${isStudy ? "飞书学习群 · 资料与答疑" : "招新群 · 示例二维码"}</p></div></article>`).join("");
    $$("[data-qr]").forEach((card) => card.addEventListener("click", () => this.openQr(card.dataset.qr, card.dataset.qrLabel)));
  },

  updateCountdown() {
    const target = new Date("2026-09-20T23:59:59+08:00");
    let diff = Math.max(0, target - new Date());
    const days = Math.floor(diff / 86400000); diff %= 86400000;
    const hours = Math.floor(diff / 3600000); diff %= 3600000;
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor(diff % 60000 / 1000);
    const values = [days, hours, minutes, seconds];
    $$("#countdown strong").forEach((item, index) => item.textContent = String(values[index]).padStart(2, "0"));
  },

  openQr(name, label) {
    $("#qrLarge").innerHTML = `<div class="fake-qr"></div><h2>${name}</h2><p>${label === "飞书学习群" ? "扫码加入飞书群，获取学习资料、前辈答疑与项目交流" : "微信扫码加入该部门招新群"}</p><small>${label} · 示例二维码 · 正式上线前替换</small>`;
    $("#qrModal").showModal();
  },

  bindNavigation() {
    window.addEventListener("hashchange", () => this.routeFromHash());
    $$("[data-route]").forEach((link) => link.addEventListener("click", (event) => {
      event.preventDefault();
      this.navigate(link.dataset.route);
    }));
    $$("[data-route-button]").forEach((button) => button.addEventListener("click", () => this.navigate(button.dataset.routeButton)));
    $$("[data-scroll-button]").forEach((button) => button.addEventListener("click", () => this.scrollTo(button.dataset.scrollButton)));
    $$("[data-scroll-target]").forEach((link) => link.addEventListener("click", (event) => {
      event.preventDefault();
      this.navigate("home", false);
      setTimeout(() => this.scrollTo(link.dataset.scrollTarget), 80);
    }));
    $("#menuButton").addEventListener("click", () => this.toggleMenu());
    $$("#projectTabs button").forEach((button) => button.addEventListener("click", () => {
      state.projectFilter = button.dataset.filter;
      $$("#projectTabs button").forEach((item) => item.classList.toggle("is-active", item === button));
      this.renderProjects();
      projectRipple.pulse();
    }));
    $("#projectCore").addEventListener("click", () => projectRipple.explode());
    $$("#alumniSwitch button").forEach((button) => button.addEventListener("click", () => {
      state.alumniView = button.dataset.alumniView;
      $$("#alumniSwitch button").forEach((item) => item.classList.toggle("is-active", item === button));
      $$(".alumni-panel").forEach((panel) => panel.classList.toggle("is-active", panel.dataset.alumniPanel === state.alumniView));
    }));
    $$("#qrTabs button").forEach((button) => button.addEventListener("click", () => {
      state.qrType = button.dataset.qrType;
      $$("#qrTabs button").forEach((item) => item.classList.toggle("is-active", item === button));
      this.renderQrCards();
    }));
  },

  navigate(route, updateHash = true) {
    state.route = route;
    $$(".view").forEach((view) => view.classList.toggle("is-active", view.dataset.view === route));
    $$(".desktop-nav [data-route]").forEach((link) => link.classList.toggle("is-active", link.dataset.route === route));
    $("#floatingJoin").classList.toggle("is-hidden", route === "join" || route === "projects");
    if (updateHash) history.pushState(null, "", `#${route}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
    this.toggleMenu(false);
    if (route === "projects") setTimeout(() => projectRipple.resize(), 80);
  },

  routeFromHash(scroll = true) {
    const route = location.hash.replace("#", "");
    if (["about", "projects", "alumni", "join"].includes(route)) this.navigate(route, false);
    else if (route === "departments") {
      this.navigate("home", false);
      if (scroll) setTimeout(() => this.scrollTo("departments"), 100);
    } else this.navigate("home", false);
  },

  scrollTo(id) { document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); },

  toggleMenu(force) {
    const open = typeof force === "boolean" ? force : !$("#mobileMenu").classList.contains("is-open");
    $("#mobileMenu").classList.toggle("is-open", open);
    $("#mobileMenu").setAttribute("aria-hidden", String(!open));
    $("#menuButton").classList.toggle("is-open", open);
    $("#menuButton").setAttribute("aria-expanded", String(open));
  },

  bindTheme() {
    const saved = localStorage.getItem("lanshan-theme");
    if (saved === "dark") document.body.classList.add("dark");
    $("#themeToggle").addEventListener("click", () => {
      document.body.classList.toggle("dark");
      localStorage.setItem("lanshan-theme", document.body.classList.contains("dark") ? "dark" : "light");
    });
  },

  bindScrollEffects() {
    window.addEventListener("scroll", () => $("#siteHeader").classList.toggle("is-scrolled", scrollY > 40), { passive: true });
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      if (entry.target.id === "metricGrid") this.animateCounters();
      observer.unobserve(entry.target);
    }), { threshold: .16 });
    $$(".reveal").forEach((element) => observer.observe(element));
  },

  animateCounters() {
    $$("[data-count]").forEach((element) => {
      const target = Number(element.dataset.count);
      const suffix = element.querySelector("small").outerHTML;
      const start = performance.now();
      const update = (now) => {
        const progress = Math.min(1, (now - start) / 1100);
        element.innerHTML = `${Math.round(target * (1 - (1 - progress) ** 3))}${suffix}`;
        if (progress < 1) requestAnimationFrame(update);
      };
      requestAnimationFrame(update);
    });
  },

  bindModals() {
    $("[data-close-modal]").addEventListener("click", () => $("#projectModal").close());
    $("[data-close-qr]").addEventListener("click", () => $("#qrModal").close());
    $$(".modal").forEach((modal) => modal.addEventListener("click", (event) => {
      if (event.target === modal) modal.close();
    }));
  },

  toast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2600);
  }
};

const particleLogo = {
  canvas: null, ctx: null, particles: [], pointer: { x: 0, y: 0 }, raf: null, burstStarted: 0,
  init() {
    this.canvas = $("#particleCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.resize();
    window.addEventListener("resize", () => this.resize());
    $("#hero").addEventListener("pointermove", (event) => {
      const rect = this.canvas.getBoundingClientRect();
      this.pointer.x = (event.clientX - rect.left) / rect.width - .5;
      this.pointer.y = (event.clientY - rect.top) / rect.height - .5;
    });
    $("#hero").addEventListener("pointerleave", () => { this.pointer.x = 0; this.pointer.y = 0; });
    this.canvas.addEventListener("click", () => this.explode());
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) this.animate();
    else this.draw(true);
  },
  explode() {
    this.burstStarted = performance.now();
  },
  makePoints() {
    const points = [];
    const addSvgPath = (pathData, count, depth, layerIndex, layerCount) => {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", pathData);
      const total = path.getTotalLength();
      for (let i = 0; i < count; i++) {
        const point = path.getPointAtLength(i / (count - 1) * total);
        const normalizedDepth = layerCount <= 1 ? 0 : layerIndex / (layerCount - 1) - .5;
        points.push({
          x: (point.x / 270 - .5) * (1 + Math.abs(normalizedDepth) * .035) + .5,
          y: point.y / 150 + normalizedDepth * .025,
          z: depth + (Math.random() - .5) * .035,
          ridge: Math.abs(normalizedDepth) < .04
        });
      }
    };
    const layerCount = innerWidth < 620 ? 7 : 15;
    for (let layer = 0; layer < layerCount; layer++) {
      const depth = (layer / (layerCount - 1) - .5) * 1.8;
      addSvgPath(LOGO_MOUNTAIN_PATH, innerWidth < 620 ? 105 : 190, depth, layer, layerCount);
    }
    addSvgPath(LOGO_MOUNTAIN_PATH, innerWidth < 620 ? 250 : 520, 0, 0, 1);
    const ridgePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    ridgePath.setAttribute("d", LOGO_MOUNTAIN_PATH);
    const ridgeLength = ridgePath.getTotalLength();
    const ridgeSamples = Array.from({ length: 360 }, (_, index) => {
      const point = ridgePath.getPointAtLength(index / 359 * ridgeLength);
      return { x: point.x / 270, y: point.y / 150 };
    });
    const ridgeAt = (x) => ridgeSamples.reduce((nearest, point) =>
      Math.abs(point.x - x) < Math.abs(nearest.x - x) ? point : nearest
    ).y;
    const faceCount = innerWidth < 620 ? 650 : 2300;
    for (let i = 0; i < faceCount; i++) {
      const x = .045 + Math.random() * .91;
      const top = ridgeAt(x);
      const depthOnFace = Math.pow(Math.random(), .82);
      const y = top + (.935 - top) * depthOnFace;
      const faceArc = Math.sin(depthOnFace * Math.PI);
      points.push({
        x,
        y,
        z: faceArc * (.28 + Math.sin(x * Math.PI) * .62) + (Math.random() - .5) * .1,
        surface: true
      });
    }
    const contourLevels = innerWidth < 620 ? 4 : 8;
    for (let level = 1; level <= contourLevels; level++) {
      for (let i = 0; i < (innerWidth < 620 ? 70 : 150); i++) {
        const x = .045 + i / (innerWidth < 620 ? 69 : 149) * .91;
        const top = ridgeAt(x);
        const depthOnFace = level / (contourLevels + 1);
        points.push({
          x,
          y: top + (.935 - top) * depthOnFace,
          z: Math.sin(depthOnFace * Math.PI) * (.3 + Math.sin(x * Math.PI) * .6),
          contour: true
        });
      }
    }
    for(let i=0;i<(innerWidth < 620 ? 120 : 280);i++) points.push({
      x:Math.random(),
      y:Math.random(),
      z:0,
      size:.45+Math.random()*1.8,
      screenStar:true
    });
    this.particles = points.map((point, index) => ({...point, seed:index*.37+Math.random()*4}));
  },
  resize() {
    const ratio = Math.min(devicePixelRatio, 2);
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * ratio;
    this.canvas.height = rect.height * ratio;
    this.ctx.setTransform(ratio,0,0,ratio,0,0);
    this.width = rect.width; this.height = rect.height;
    this.makePoints();
  },
  animate(time=0) { this.draw(false,time); this.raf=requestAnimationFrame((t)=>this.animate(t)); },
  draw(staticFrame=false,time=0) {
    const ctx=this.ctx,w=this.width,h=this.height;
    ctx.clearRect(0,0,w,h);
    const burstProgress=this.burstStarted?Math.min(1,(time-this.burstStarted)/2200):1;
    const burst=burstProgress<1?Math.sin(burstProgress*Math.PI):0;
    if(burstProgress>=1)this.burstStarted=0;
    const mobile=w<780, scale=Math.min(w*(mobile?.95:.48),h*(mobile?.42:.63));
    const cx=mobile?w*.56:w*.73,cy=mobile?h*.68:h*.47;
    const angleY=this.pointer.x*.68+(staticFrame?-.12:Math.sin(time*.00022)*.16);
    const angleX=-.08-this.pointer.y*.3+(staticFrame?0:Math.cos(time*.00017)*.035);
    const dark=document.body.classList.contains("dark");
    ctx.globalCompositeOperation=dark?"lighter":"source-over";
    for(const p of this.particles){
      if(p.screenStar){
        const twinkle=.35+Math.sin(time*.0012+p.seed)*.28;
        ctx.globalAlpha=dark?twinkle:.12+twinkle*.22;
        ctx.fillStyle=dark?"#d9f7ff":"#526fa8";
        const starX=p.x*w,starY=p.y*h;
        ctx.beginPath();ctx.arc(starX,starY,p.size,0,Math.PI*2);ctx.fill();
        if(p.size>1.7){
          ctx.globalAlpha*=.55;
          ctx.strokeStyle=dark?"#9eeeff":"#6a88bf";
          ctx.lineWidth=.7;
          ctx.beginPath();
          ctx.moveTo(starX-p.size*3,starY);ctx.lineTo(starX+p.size*3,starY);
          ctx.moveTo(starX,starY-p.size*3);ctx.lineTo(starX,starY+p.size*3);
          ctx.stroke();
        }
        continue;
      }
      const burstAngle=p.seed*2.399;
      const burstForce=burst*scale*(p.ambient?.38:.56)*(0.55+(p.seed%1)*.65);
      let x=(p.x-.5)*scale*1.35+Math.cos(burstAngle)*burstForce;
      let y=(p.y-.5)*scale+Math.sin(burstAngle)*burstForce*.72;
      let z=p.z*scale*.42+Math.sin(p.seed*.83)*burstForce*.9;
      const x1=x*Math.cos(angleY)-z*Math.sin(angleY),z1=x*Math.sin(angleY)+z*Math.cos(angleY);
      const y1=y*Math.cos(angleX)-z1*Math.sin(angleX),z2=y*Math.sin(angleX)+z1*Math.cos(angleX);
      const perspective=700/(700+z2);
      const sx=cx+x1*perspective,sy=cy+y1*perspective;
      if(p.ambient){ctx.globalAlpha=.18+Math.sin(time*.001+p.seed)*.11;ctx.fillStyle=dark?"#bdeeff":"#526fa8";}
      else{
        const depthLight=Math.max(0,Math.min(1,(p.z+1.1)/2.2));
        ctx.globalAlpha=(p.ridge?.78:p.contour?.46:p.surface?.16+depthLight*.2:.22+depthLight*.2)+Math.sin(time*.0018+p.seed)*.07;
        ctx.fillStyle=p.ridge?(dark?"#9ff5ff":"#365b9e"):p.contour?(dark?"#62e8ff":"#5f82bd"):p.surface?(dark?"#28c7f4":"#7898cc"):(dark?"#4cdfff":"#607fb7");
      }
      const size=(p.ambient?1.05:(p.ridge?1.7:p.contour?1.35:p.surface?1.05:1.18))*perspective;
      ctx.beginPath();ctx.arc(sx,sy,size,0,Math.PI*2);ctx.fill();
    }
    ctx.globalCompositeOperation="source-over";
    ctx.globalAlpha=1;
  }
};

const projectRipple = {
  canvas: null,
  ctx: null,
  width: 0,
  height: 0,
  spherePoints: [],
  transitionStarted: 0,
  manualPulse: 0,
  explored: false,

  init() {
    this.canvas = $("#projectRippleCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.makeSphere();
    this.resize();
    window.addEventListener("resize", () => this.resize());
    requestAnimationFrame((time) => this.animate(time));
  },

  makeSphere() {
    const count = innerWidth < 620 ? 520 : 1150;
    this.spherePoints = Array.from({ length: count }, (_, index) => {
      const y = 1 - index / (count - 1) * 2;
      const radius = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = Math.PI * (3 - Math.sqrt(5)) * index;
      return {
        x: Math.cos(theta) * radius,
        y,
        z: Math.sin(theta) * radius,
        seed: index * .618 + Math.random() * 2
      };
    });
  },

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const ratio = Math.min(devicePixelRatio, 2);
    this.canvas.width = Math.round(rect.width * ratio);
    this.canvas.height = Math.round(rect.height * ratio);
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.width = rect.width;
    this.height = rect.height;
  },

  explode() {
    if (this.explored) {
      this.pulse();
      return;
    }
    this.transitionStarted = performance.now();
    $("#projectExplorer").classList.add("is-launching");
    setTimeout(() => {
      this.explored = true;
      $("#projectExplorer").classList.remove("is-launching");
      $("#projectExplorer").classList.add("is-explored");
      this.pulse();
    }, 760);
  },

  pulse() {
    this.manualPulse = performance.now();
  },

  animate(time) {
    this.draw(time);
    requestAnimationFrame((next) => this.animate(next));
  },

  draw(time) {
    if (!this.width || !this.height) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const cx = w * (w < 600 ? .5 : w < 920 ? .52 : .64);
    const cy = h * (w < 600 ? .65 : w < 920 ? .59 : .56);
    const dark = document.body.classList.contains("dark");
    const color = dark ? "242,248,255" : "72,105,176";
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = dark ? "lighter" : "source-over";

    const transitionProgress = this.transitionStarted ? Math.min(1, (time - this.transitionStarted) / 1250) : 0;
    if (!this.explored) {
      const sphereRadius = Math.min(w, h) * (w < 600 ? .085 : .105);
      const rotation = time * .00028;
      const burst = transitionProgress ? Math.sin(Math.min(1, transitionProgress) * Math.PI * .56) : 0;
      for (const point of this.spherePoints) {
        const x = point.x * Math.cos(rotation) - point.z * Math.sin(rotation);
        const z = point.x * Math.sin(rotation) + point.z * Math.cos(rotation);
        const perspective = 1 / (1.7 - z * .34);
        const burstAngle = point.seed * 2.399;
        const burstDistance = burst * Math.min(w, h) * (.22 + point.seed % 1 * .18);
        const px = cx + x * sphereRadius * perspective + Math.cos(burstAngle) * burstDistance;
        const py = cy + point.y * sphereRadius * perspective + Math.sin(burstAngle) * burstDistance * .62;
        const depth = (z + 1) / 2;
        ctx.globalAlpha = Math.max(0, (1 - transitionProgress) * (.18 + depth * .72));
        ctx.fillStyle = `rgb(${color})`;
        ctx.beginPath();
        ctx.arc(px, py, .55 + depth * 1.25, 0, Math.PI * 2);
        ctx.fill();
      }
      this.drawRipple(ctx, cx, cy, transitionProgress * Math.min(w, h) * .42, (1 - transitionProgress) * .7, color, time, 0);
    }

    if (this.explored) {
      const maxRadius = Math.min(w * (w < 920 ? .42 : .34), h * .47);
      for (let index = 0; index < 5; index++) {
        const phase = (time * .00034 + index / 5) % 1;
        this.drawRipple(ctx, cx, cy, 34 + phase * maxRadius, Math.pow(1 - phase, 1.65) * .56, color, time, index);
      }
      ctx.globalAlpha = .65;
      ctx.fillStyle = `rgb(${color})`;
      ctx.beginPath();
      ctx.arc(cx, cy, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this.manualPulse) {
      const age = (time - this.manualPulse) / 1100;
      if (age < 1) this.drawRipple(ctx, cx, cy, 22 + age * Math.min(w, h) * .43, Math.pow(1 - age, 1.25) * .92, color, time, 9);
      else this.manualPulse = 0;
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  },

  drawRipple(ctx, cx, cy, radius, alpha, color, time, seed) {
    if (radius < 2 || alpha <= 0) return;
    ctx.strokeStyle = `rgba(${color},${alpha * .42})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
    const count = Math.max(38, Math.round(radius * .72));
    ctx.fillStyle = `rgb(${color})`;
    for (let index = 0; index < count; index++) {
      const angle = index / count * Math.PI * 2;
      const jitter = Math.sin(index * 12.37 + seed * 4.1 + time * .001) * 2.3;
      const px = cx + Math.cos(angle) * (radius + jitter);
      const py = cy + Math.sin(angle) * (radius + jitter) * .68;
      ctx.globalAlpha = alpha * (.35 + (index % 7) / 10);
      ctx.beginPath();
      ctx.arc(px, py, .45 + (index % 5) * .14, 0, Math.PI * 2);
      ctx.fill();
    }
  }
};

app.init().catch((error) => {
  console.error(error);
  document.body.insertAdjacentHTML("beforeend", `<div class="toast is-visible">原型数据加载失败，请刷新页面</div>`);
});
