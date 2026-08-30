import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * A slowly rotating technical line diagram of a record "capsule" — drawn as
 * ink hairlines on paper rather than a glowing orb. Raw Three.js, no lighting.
 */
export function RecordDiagram() {
    const mountRef = useRef(null);

    useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return;

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const INK = 0x17191c;
        const ALERT = 0xb4342b;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
        camera.position.set(0, 0, 9);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        mount.appendChild(renderer.domElement);
        renderer.domElement.style.display = 'block';

        const root = new THREE.Group();
        scene.add(root);

        const line = (opacity, color = INK) => new THREE.LineBasicMaterial({ color, transparent: true, opacity });

        // Outer geodesic shell, hairline only
        const shell = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(2.3, 1)), line(0.32));
        root.add(shell);

        // Inner tetra-frame, slightly darker
        const inner = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.OctahedronGeometry(1.35, 0)), line(0.5));
        root.add(inner);

        // The record cross, outlined in alert red
        const cross = new THREE.Group();
        const crossMat = line(0.85, ALERT);
        const vBar = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.34, 1.2, 0.34)), crossMat);
        const hBar = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.2, 0.34, 0.34)), crossMat);
        cross.add(vBar, hBar);
        root.add(cross);

        // Concentric measurement circles, like a drafting overlay
        const circle = (radius, opacity) => {
            const pts = new THREE.EllipseCurve(0, 0, radius, radius, 0, Math.PI * 2).getPoints(128);
            const geo = new THREE.BufferGeometry().setFromPoints(pts);
            return new THREE.LineLoop(geo, line(opacity));
        };
        const ringA = circle(3.1, 0.22);
        ringA.rotation.x = Math.PI / 2.4;
        const ringB = circle(3.6, 0.14);
        ringB.rotation.x = Math.PI / 1.75;
        ringB.rotation.z = Math.PI / 7;
        root.add(ringA, ringB);

        // Sparse vertex dots — data points on the shell, not a particle cloud
        const dotCount = 120;
        const dots = new Float32Array(dotCount * 3);
        for (let i = 0; i < dotCount; i++) {
            const r = 2.35 + Math.random() * 1.05;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            dots[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            dots[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.75;
            dots[i * 3 + 2] = r * Math.cos(phi);
        }
        const dotGeo = new THREE.BufferGeometry();
        dotGeo.setAttribute('position', new THREE.BufferAttribute(dots, 3));
        const points = new THREE.Points(
            dotGeo,
            new THREE.PointsMaterial({
                color: INK,
                size: 0.032,
                transparent: true,
                opacity: 0.4,
            })
        );
        root.add(points);

        // Pointer parallax
        const eased = { x: 0, y: 0 };
        const target = { x: 0, y: 0 };
        const onPointerMove = (event) => {
            const rect = mount.getBoundingClientRect();
            target.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
            target.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
        };
        window.addEventListener('pointermove', onPointerMove);

        const resize = () => {
            const { clientWidth: w, clientHeight: h } = mount;
            if (!w || !h) return;
            renderer.setSize(w, h, false);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        };
        resize();
        const observer = new ResizeObserver(resize);
        observer.observe(mount);

        const clock = new THREE.Clock();
        let frame = 0;
        const render = () => {
            frame = requestAnimationFrame(render);
            const t = clock.getElapsedTime();

            eased.x += (target.x - eased.x) * 0.04;
            eased.y += (target.y - eased.y) * 0.04;

            if (reduceMotion) {
                root.rotation.set(eased.y * 0.16, eased.x * 0.24, 0);
            } else {
                root.rotation.y = t * 0.1 + eased.x * 0.32;
                root.rotation.x = Math.sin(t * 0.16) * 0.09 + eased.y * 0.2;
                inner.rotation.y = t * 0.24;
                inner.rotation.x = -t * 0.16;
                cross.rotation.y = -t * 0.3;
                ringA.rotation.z = t * 0.12;
                ringB.rotation.y = -t * 0.09;
                points.rotation.y = -t * 0.05;
            }

            renderer.render(scene, camera);
        };
        render();

        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
            window.removeEventListener('pointermove', onPointerMove);
            renderer.domElement.remove();
            renderer.dispose();
            scene.traverse((obj) => {
                const item = obj;
                if (item.geometry) item.geometry.dispose();
                const mat = item.material;
                if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
                else if (mat) mat.dispose();
            });
        };
    }, []);

    return <div ref={mountRef} aria-hidden="true" className="h-full w-full" />;
}
