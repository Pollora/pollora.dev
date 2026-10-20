// The line-art 3D ghost of the home hero, modelled on the logo (pollora-icon.svg).
// Loaded after the first paint by GhostHero.astro. Everything is drawn with lines: a faint dense grid, a
// silhouette that follows the view, bold glasses and smile. Hidden lines are masked by depth-only meshes.
// The prototype it comes from (v4) lives in prototypes/mascot-ghost/.
import {
	Color,
	DoubleSide,
	Float32BufferAttribute,
	Group,
	MathUtils,
	Matrix4,
	Mesh,
	MeshBasicMaterial,
	BufferGeometry,
	PerspectiveCamera,
	Raycaster,
	Scene,
	TorusGeometry,
	Vector2,
	Vector3,
	WebGLRenderer,
} from 'three';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

const V3 = (x: number, y: number, z: number) => new Vector3(x, y, z);
const sm = (a: number, b: number, x: number) => {
	const t = MathUtils.clamp((x - a) / (b - a), 0, 1);
	return t * t * (3 - 2 * t);
};

// Shape of the body: a dome, nearly straight flanks, a scalloped hem
const LOBES = 4;
const TOP = 1.6;
const BOT = -0.95;
const ROWS = 40;
const COLS = 144;
const radAt = (y: number) => (y > 0.55 ? Math.sqrt(Math.max(0, 1 - ((y - 0.55) / 1.05) ** 2)) : 1.0 + 0.13 * Math.pow((0.55 - y) / 1.5, 1.4));
const lobe = (th: number) => Math.sqrt(Math.cos(LOBES * th + 0.4) ** 2 + 0.012);
const surf = (t: number, th: number) => {
	const y0 = TOP - t * (TOP - BOT);
	const hem = sm(0.78, 1, t) * 0.42 * Math.pow(lobe(th), 0.62);
	const y = y0 + (t > 0.78 ? -hem + 0.2 * Math.cos(th) ** 2 * sm(0.78, 1, t) : 0);
	const rr = radAt(y0) * (1 - 0.015 * sm(0.9, 1, t) * (1 - lobe(th)));
	return V3(Math.cos(th) * rr, y, Math.sin(th) * rr);
};

const COLOR_A = new Color('#fb196d');
const COLOR_B = new Color('#ff9a14');
const tmp = new Color();
const tint = (v: Vector3) => {
	const u = MathUtils.clamp(((TOP - v.y) / (TOP - BOT)) * 0.65 + ((v.x + 1.2) / 2.4) * 0.35, 0, 1);
	return tmp.copy(COLOR_A).lerp(COLOR_B, u).clone();
};

export interface Ghost {
	destroy(): void;
}

export function mountGhost(host: HTMLElement): Ghost | null {
	const size = () => Math.max(1, Math.round(host.clientWidth));
	let W = size();

	let renderer: WebGLRenderer;
	try {
		renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
	} catch {
		return null; // no WebGL: the poster stays
	}
	renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
	renderer.setSize(W, W);
	renderer.setClearColor(0x000000, 0);
	const canvas = renderer.domElement;
	canvas.className = 'ghost-canvas';
	host.append(canvas);

	const scene = new Scene();
	const camera = new PerspectiveCamera(32, 1, 0.1, 100);
	camera.position.set(0, 0.1, 8.2);
	const root = new Group();
	scene.add(root);
	const res = new Vector2(W, W);
	const lineMat = (width: number, extra: Record<string, unknown> = {}) =>
		new LineMaterial({ vertexColors: true, linewidth: width, side: DoubleSide, resolution: res, ...extra });

	// --- geometry -----------------------------------------------------------------------------
	const occluder = new MeshBasicMaterial({ colorWrite: false, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2, side: DoubleSide });
	const hitMeshes: Mesh[] = [];
	const addMesh = (geo: BufferGeometry, m?: Matrix4) => {
		const g = geo.clone();
		if (m) g.applyMatrix4(m);
		const mesh = new Mesh(g, occluder);
		root.add(mesh);
		hitMeshes.push(mesh);
	};
	const faint: Vector3[] = [];
	const solid: Vector3[] = [];
	const bold: Vector3[] = [];
	let target = faint;
	const poly = (pts: Vector3[], closed = false, m?: Matrix4, into = target) => {
		const p = m ? pts.map((v) => v.clone().applyMatrix4(m)) : pts;
		for (let i = 0; i < p.length - 1; i++) into.push(p[i], p[i + 1]);
		if (closed) into.push(p[p.length - 1], p[0]);
	};

	// the body as a depth mask
	const grid: Vector3[][] = [];
	for (let i = 0; i <= ROWS; i++) {
		const row: Vector3[] = [];
		for (let k = 0; k < COLS; k++) row.push(surf(Math.max(i / ROWS, 0.0008), (k / COLS) * Math.PI * 2));
		grid.push(row);
	}
	{
		const pos: number[] = [];
		const idx: number[] = [];
		grid.forEach((rw) => rw.forEach((v) => pos.push(v.x, v.y, v.z)));
		for (let i = 0; i < ROWS; i++)
			for (let k = 0; k < COLS; k++) {
				const a0 = i * COLS + k;
				const a1 = i * COLS + ((k + 1) % COLS);
				const b0 = (i + 1) * COLS + k;
				const b1 = (i + 1) * COLS + ((k + 1) % COLS);
				idx.push(a0, b0, a1, a1, b0, b1);
			}
		const g = new BufferGeometry();
		g.setAttribute('position', new Float32BufferAttribute(pos, 3));
		g.setIndex(idx);
		addMesh(g);
	}

	// glasses frames: the lenses sit on the surface, tilted with it
	const LX = 0.42;
	const lensFrame = (x: number) => {
		const yy = 0.52;
		const rr = radAt(yy);
		const zs = Math.sqrt(Math.max(0.01, rr * rr - x * x));
		return new Matrix4().makeTranslation(x, yy, zs + 0.04).multiply(new Matrix4().makeRotationY(Math.atan2(x, zs)));
	};
	const frames = [lensFrame(-LX), lensFrame(LX)];
	const inv = frames.map((f) => f.clone().invert());
	const inLens = (v: Vector3) =>
		inv.some((m) => {
			const l = v.clone().applyMatrix4(m);
			return Math.hypot(l.x, l.y) < 0.4 && l.z > -0.5;
		});
	const clipped = (pts: Vector3[], closed: boolean) => {
		let run: Vector3[] = [];
		const flush = () => {
			if (run.length > 1) poly(run);
			run = [];
		};
		for (const v of closed ? [...pts, pts[0]] : pts) {
			if (inLens(v)) flush();
			else run.push(v);
		}
		flush();
	};
	// the dense, faint grid
	target = faint;
	for (let i = 2; i <= 31; i += 2) clipped(grid[i], true);
	for (let k = 0; k < COLS; k += 4) clipped(grid.map((rw) => rw[k]), false);
	// the hem, one line
	target = solid;
	{
		const hem: Vector3[] = [];
		for (let k = 0; k < 480; k++) hem.push(surf(1, (k / 480) * Math.PI * 2));
		poly(hem, true);
	}
	// rims and bridge
	for (const m of frames) {
		addMesh(new TorusGeometry(0.32, 0.06, 12, 48), m);
		const c: Vector3[] = [];
		for (let k = 0; k < 64; k++) {
			const a = (k / 64) * Math.PI * 2;
			c.push(V3(Math.cos(a) * 0.345, Math.sin(a) * 0.345, 0.08));
		}
		poly(c, true, m, bold);
	}
	{
		const pl = V3(0.345, 0, 0.08).applyMatrix4(frames[0]);
		const pr = V3(-0.345, 0, 0.08).applyMatrix4(frames[1]);
		const br: Vector3[] = [];
		for (let k = 0; k <= 8; k++) br.push(pl.clone().lerp(pr, k / 8));
		poly(br, false, undefined, bold);
	}

	const build = (list: Vector3[]) => {
		const arr: number[] = [];
		const cols: number[] = [];
		for (const v of list) {
			arr.push(v.x, v.y, v.z);
			const c = tint(v);
			cols.push(c.r, c.g, c.b);
		}
		const g = new LineSegmentsGeometry().setPositions(arr);
		g.setColors(cols);
		return g;
	};
	const add = (geo: LineSegmentsGeometry, material: LineMaterial, order: number, parent: Group = root) => {
		const l = new LineSegments2(geo, material);
		l.frustumCulled = false;
		l.renderOrder = order;
		parent.add(l);
		return l;
	};

	const faintMat = lineMat(1.5, { transparent: true, opacity: 0.15, depthWrite: false });
	const solidMat = lineMat(3.0);
	const silMat = lineMat(3.0, { depthTest: false });
	const boldMat = lineMat(5.6);
	add(build(faint), faintMat, 1);
	add(build(solid), solidMat, 2);
	add(build(bold), boldMat, 3);
	const sil = add(build([]), silMat, 2);

	// mouth: a smile that can open into an "O"
	const mouthAt = (m: number) => {
		const pts: Vector3[] = [];
		const z = Math.sqrt(Math.max(0.01, radAt(0) ** 2 - 0.03)) + 0.04;
		const N = 16;
		for (let k = 0; k <= N; k++) {
			const a = Math.PI * (0.1 + (0.8 * k) / N);
			const sx = Math.cos(a) * 0.17;
			const sy = 0.02 - Math.sin(a) * 0.1;
			const phi = (k / N) * Math.PI * 2 + Math.PI / 2;
			const ox = Math.cos(phi) * 0.095;
			const oy = -0.09 + Math.sin(phi) * 0.12;
			pts.push(V3(MathUtils.lerp(sx, ox, m), MathUtils.lerp(sy, oy, m), z));
		}
		const list: Vector3[] = [];
		for (let i = 0; i < pts.length - 1; i++) list.push(pts[i], pts[i + 1]);
		return list;
	};
	let mouth = add(build(mouthAt(0)), boldMat, 3);
	let mouthAmount = -1;
	const setMouth = (m: number) => {
		if (Math.abs(m - mouthAmount) < 0.004) return;
		mouthAmount = m;
		const old = mouth.geometry;
		mouth.geometry = build(mouthAt(m));
		old.dispose();
	};

	// pupils: solid dots (a very wide line), and a lid line for the blink
	const dotMat = new LineMaterial({ vertexColors: true, linewidth: 0.17, worldUnits: true, side: DoubleSide, resolution: res });
	const lidMat = lineMat(5.6);
	const pupils = frames.map((m, i) => {
		const g = new Group();
		g.matrixAutoUpdate = false;
		g.matrix.copy(m);
		root.add(g);
		const base = V3(i === 0 ? 0.15 : -0.15, -0.01, 0.004);
		const c = tint(V3(0, 0, 0).applyMatrix4(m));
		const col = [c.r, c.g, c.b, c.r, c.g, c.b];
		const dg = new LineSegmentsGeometry().setPositions([0, 0, 0, 0.0005, 0, 0]);
		dg.setColors(col);
		const dot = new LineSegments2(dg, dotMat);
		dot.frustumCulled = false;
		dot.position.copy(base);
		g.add(dot);
		const lg = new LineSegmentsGeometry().setPositions([-0.11, 0, 0, 0.11, 0, 0]);
		lg.setColors(col);
		const lid = new LineSegments2(lg, lidMat);
		lid.frustumCulled = false;
		lid.position.copy(base);
		lid.visible = false;
		g.add(lid);
		return { base, dot, lid };
	});

	// the silhouette follows the view: the two meridians seen edge-on
	const updateSil = () => {
		const th = root.rotation.y;
		const list: Vector3[] = [];
		for (const a of [th, th + Math.PI]) {
			let prev: Vector3 | null = null;
			for (let i = 0; i <= ROWS; i++) {
				const v = surf(Math.max(i / ROWS, 0.0008), a);
				if (prev) list.push(prev, v);
				prev = v;
			}
		}
		const old = sil.geometry;
		sil.geometry = build(list);
		old.dispose();
	};

	// --- behaviour ----------------------------------------------------------------------------
	let tx = 0;
	let ty = 0;
	let cx = 0;
	let cy = 0;
	let gx = 0;
	let gy = 0;
	let blinkAt = 2500;
	let blinkEnd = 0;
	let react = -1; // time of the click, or -1
	const REACT_MS = 1100;
	let visible = true;
	let raf = 0;

	const onPointer = (e: PointerEvent) => {
		const r = host.getBoundingClientRect();
		tx = MathUtils.clamp(((e.clientX - r.left) / r.width - 0.5) * 2, -1.6, 1.6);
		ty = MathUtils.clamp(((e.clientY - r.top) / r.height - 0.5) * 2, -1.6, 1.6);
	};
	addEventListener('pointermove', onPointer, { passive: true });

	const ray = new Raycaster();
	const hits = (e: PointerEvent) => {
		const r = canvas.getBoundingClientRect();
		ray.setFromCamera(new Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
		return ray.intersectObjects(hitMeshes, false).length > 0;
	};
	const onMove = (e: PointerEvent) => {
		canvas.style.cursor = hits(e) ? 'pointer' : '';
	};
	const onClick = (e: PointerEvent) => {
		if (!hits(e)) return;
		react = performance.now();
		host.classList.remove('ghost-pulse');
		void host.offsetWidth;
		host.classList.add('ghost-pulse');
	};
	canvas.addEventListener('pointermove', onMove);
	canvas.addEventListener('pointerdown', onClick);

	const frame = (ms: number) => {
		raf = 0;
		if (!visible || document.hidden) return;
		const scroll = MathUtils.clamp(scrollY / (innerHeight * 0.9), 0, 1);
		cx += (tx - cx) * 0.06;
		cy += (ty - cy) * 0.06;
		gx += (tx - gx) * 0.14;
		gy += (ty - gy) * 0.14;

		// the reaction: 0 to 1 over REACT_MS
		let k = react < 0 ? -1 : (ms - react) / REACT_MS;
		if (k >= 1) {
			react = -1;
			k = -1;
			blinkAt = ms + 120;
		}
		const surprise = k < 0 ? 0 : k < 0.12 ? k / 0.12 : k < 0.62 ? 1 : 1 - (k - 0.62) / 0.38;
		const hop = k < 0 ? 0 : Math.sin(Math.min(k / 0.5, 1) * Math.PI) * 0.34 * (1 - k * 0.4);
		const spin = k < 0 ? 0 : Math.sin(Math.min(k, 1) * Math.PI) * 0.5;

		root.rotation.y = cx * 0.9 + Math.sin(ms / 2800) * 0.12 + scroll * 3.5 + spin;
		root.rotation.x = cy * 0.3 + Math.sin(ms / 3600) * 0.03;
		root.position.y = -0.2 + Math.sin(ms / 1100) * 0.06 + hop;
		root.scale.set(1 + 0.05 * surprise, 1 - 0.06 * surprise + (hop > 0 ? 0.04 : 0), 1 + 0.05 * surprise);
		faintMat.opacity = 0.15 + 0.17 * scroll;

		if (ms > blinkAt) {
			blinkEnd = ms + 150;
			blinkAt = ms + 2600 + Math.random() * 3200;
		}
		const closed = ms < blinkEnd && k < 0;
		dotMat.linewidth = 0.17 - 0.07 * surprise; // small pupils: surprised
		for (const p of pupils) {
			p.dot.visible = !closed;
			p.lid.visible = closed;
			p.dot.position.set(p.base.x + gx * 0.09 * (1 - surprise), p.base.y - gy * 0.07 * (1 - surprise) + 0.05 * surprise, p.base.z);
		}
		setMouth(surprise);
		updateSil();
		renderer.render(scene, camera);
		raf = requestAnimationFrame(frame);
	};
	const kick = () => {
		if (!raf) raf = requestAnimationFrame(frame);
	};

	const io = new IntersectionObserver((entries) => {
		visible = entries[0].isIntersecting;
		if (visible) kick();
	});
	io.observe(host);
	const onVisibility = () => {
		if (!document.hidden) kick();
	};
	document.addEventListener('visibilitychange', onVisibility);

	const ro = new ResizeObserver(() => {
		W = size();
		renderer.setSize(W, W);
		res.set(W, W);
		kick();
	});
	ro.observe(host);

	updateSil();
	renderer.render(scene, camera);
	host.dataset.ghost = 'ready'; // the poster fades out
	kick();

	return {
		destroy() {
			cancelAnimationFrame(raf);
			removeEventListener('pointermove', onPointer);
			document.removeEventListener('visibilitychange', onVisibility);
			io.disconnect();
			ro.disconnect();
			renderer.dispose();
			canvas.remove();
		},
	};
}
