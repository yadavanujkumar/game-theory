/**
 * 3D Playable Game Theory Arena using Three.js
 * Features:
 * 1. 3D Brinkmanship Highway (Hawk-Dove Speed Duel with collision physics)
 * 2. 3D Cyber Hologram Duel (Prisoner's Dilemma with energy shields & laser beams)
 * 3. 3D Voxel Biosphere (3D Spatial Evolutionary Grid with Raycasting & 3D god tools)
 */

class Arena3D {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.animationId = null;
        this.clock = new THREE.Clock();

        // Sub-modes: 'hawk_dove' | 'matrix_duel' | 'voxel_biosphere'
        this.currentMode = 'hawk_dove';

        // State for Hawk-Dove Brinkmanship Duel
        this.hawkState = {
            active: false,
            phase: 'ready', // 'ready', 'racing', 'result'
            distance: 120,
            speed: 60,
            p1X: -20,
            p2X: 20,
            p1Action: null, // 0 = Swerve (Dove), 1 = Stay (Hawk)
            p2Action: null,
            p1Ship: null,
            p2Ship: null,
            particles: []
        };

        // State for 3D Cyber Vault Duel
        this.vaultState = {
            p1Pedestal: null,
            p2Pedestal: null,
            p1Shield: null,
            p2Shield: null,
            lasers: [],
            floatingTexts: []
        };

        // State for 3D Voxel Biosphere
        this.biosphereState = {
            gridSize: 14,
            cubes: [],
            gridData: [],
            raycaster: new THREE.Raycaster(),
            mouse: new THREE.Vector2(),
            selectedCube: null
        };

        this.initThree();
        this.setupLightsAndEnvironment();
        this.loadMode(this.currentMode);
        this.animate();
        this.setupEvents();
    }

    initThree() {
        const width = this.container.clientWidth || 900;
        const height = this.container.clientHeight || 560;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x06080f);
        this.scene.fog = new THREE.FogExp2(0x06080f, 0.012);

        this.camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
        this.camera.position.set(0, 18, 48);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.container.innerHTML = "";
        this.container.appendChild(this.renderer.domElement);

        if (window.THREE.OrbitControls) {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.maxPolarAngle = Math.PI / 2 + 0.05;
        }

        window.addEventListener('resize', () => this.onWindowResize());
    }

    setupLightsAndEnvironment() {
        const ambient = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambient);

        const dirLight = new THREE.DirectionalLight(0x00f2fe, 1.2);
        dirLight.position.set(30, 60, 40);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        this.scene.add(dirLight);

        const purpleLight = new THREE.PointLight(0x9d4edd, 2, 80);
        purpleLight.position.set(-20, 15, -10);
        this.scene.add(purpleLight);

        // Neon Cyber Grid Floor
        const grid = new THREE.GridHelper(160, 40, 0x00f2fe, 0x1b253b);
        grid.position.y = -0.01;
        this.scene.add(grid);
    }

    onWindowResize() {
        if (!this.container || !this.renderer || !this.camera) return;
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    clearSceneEntities() {
        // Remove entities with userData.isEntity = true
        const toRemove = [];
        this.scene.traverse((obj) => {
            if (obj.userData && obj.userData.isEntity) {
                toRemove.push(obj);
            }
        });
        toRemove.forEach(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
                else obj.material.dispose();
            }
            this.scene.remove(obj);
        });
    }

    loadMode(mode) {
        this.currentMode = mode;
        this.clearSceneEntities();

        if (mode === 'hawk_dove') {
            this.setupHawkDoveArena();
        } else if (mode === 'matrix_duel') {
            this.setupMatrixDuelArena();
        } else if (mode === 'voxel_biosphere') {
            this.setupVoxelBiosphere();
        }
    }

    // ==========================================
    // 1. 3D HAWK-DOVE BRINKMANSHIP HIGHWAY
    // ==========================================
    setupHawkDoveArena() {
        this.camera.position.set(0, 14, 52);
        if (this.controls) this.controls.target.set(0, 4, 0);

        // Create Runway Track
        const trackGeo = new THREE.PlaneGeometry(16, 160);
        const trackMat = new THREE.MeshStandardMaterial({
            color: 0x0a0f1d,
            roughness: 0.2,
            metalness: 0.8
        });
        const track = new THREE.Mesh(trackGeo, trackMat);
        track.rotation.x = -Math.PI / 2;
        track.position.set(0, 0, 0);
        track.receiveShadow = true;
        track.userData.isEntity = true;
        this.scene.add(track);

        // Neon Track Borders
        const borderGeo = new THREE.BoxGeometry(0.6, 0.6, 160);
        const borderMatCyan = new THREE.MeshBasicMaterial({ color: 0x00f2fe });
        const borderMatRose = new THREE.MeshBasicMaterial({ color: 0xff0054 });

        const leftBorder = new THREE.Mesh(borderGeo, borderMatCyan);
        leftBorder.position.set(-8.2, 0.3, 0);
        leftBorder.userData.isEntity = true;
        this.scene.add(leftBorder);

        const rightBorder = new THREE.Mesh(borderGeo, borderMatRose);
        rightBorder.position.set(8.2, 0.3, 0);
        rightBorder.userData.isEntity = true;
        this.scene.add(rightBorder);

        // Create 3D Cyber Ships
        this.hawkState.p1Ship = this.createCyberShip(0x00f2fe, "You (Player 1)");
        this.hawkState.p1Ship.position.set(0, 1.2, 60);
        this.hawkState.p1Ship.rotation.y = Math.PI;
        this.hawkState.p1Ship.userData.isEntity = true;
        this.scene.add(this.hawkState.p1Ship);

        this.hawkState.p2Ship = this.createCyberShip(0xff0054, "Opponent AI");
        this.hawkState.p2Ship.position.set(0, 1.2, -60);
        this.hawkState.p2Ship.userData.isEntity = true;
        this.scene.add(this.hawkState.p2Ship);

        this.hawkState.phase = 'ready';
        this.hawkState.distance = 120;
        this.update3DHUD("Ready for Brinkmanship Duel! Choose your decision below.");
    }

    createCyberShip(colorHex, label) {
        const ship = new THREE.Group();

        // Sleek aerodynamic fuselage
        const bodyGeo = new THREE.ConeGeometry(1.6, 5.5, 5);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: colorHex,
            roughness: 0.3,
            metalness: 0.8
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.rotation.x = Math.PI / 2;
        body.castShadow = true;
        ship.add(body);

        // Wings
        const wingGeo = new THREE.BoxGeometry(5.2, 0.2, 2.2);
        const wingMat = new THREE.MeshStandardMaterial({ color: 0x111625, metalness: 0.9, roughness: 0.1 });
        const wings = new THREE.Mesh(wingGeo, wingMat);
        wings.position.set(0, 0, -0.6);
        ship.add(wings);

        // Glowing Thruster
        const engineGeo = new THREE.CylinderGeometry(0.6, 0.8, 0.8, 16);
        const engineMat = new THREE.MeshBasicMaterial({ color: colorHex });
        const engine = new THREE.Mesh(engineGeo, engineMat);
        engine.rotation.x = Math.PI / 2;
        engine.position.set(0, 0, -2.8);
        ship.add(engine);

        // Light point
        const thrusterLight = new THREE.PointLight(colorHex, 2, 8);
        thrusterLight.position.set(0, 0, -3.2);
        ship.add(thrusterLight);

        return ship;
    }

    startHawkDoveMatch(playerAction, opponentKey = "tit_for_tat") {
        if (this.hawkState.phase === 'racing') return;

        this.hawkState.p1Action = playerAction; // 0 = Swerve (Dove), 1 = Stay (Hawk)
        const oppStrategy = window.STRATEGY_REGISTRY[opponentKey]();
        this.hawkState.p2Action = oppStrategy.act(0, 0); // 0 = Swerve, 1 = Stay

        this.hawkState.phase = 'racing';
        this.hawkState.p1Ship.position.set(0, 1.2, 60);
        this.hawkState.p2Ship.position.set(0, 1.2, -60);
        this.hawkState.distance = 120;

        soundFX.playTone(400, 'sawtooth', 0.5, 0.15);
        this.update3DHUD("⚡ VEHICLES CHARGING TOWARDS EACH OTHER! BRINKMANSHIP IN MOTION!");
    }

    createExplosion(position) {
        const particleCount = 60;
        const geo = new THREE.SphereGeometry(0.2, 6, 6);
        const mat = new THREE.MeshBasicMaterial({ color: 0xff3b00 });

        for (let i = 0; i < particleCount; i++) {
            const p = new THREE.Mesh(geo, mat);
            p.position.copy(position);
            p.userData = {
                vel: new THREE.Vector3(
                    (Math.random() - 0.5) * 1.6,
                    Math.random() * 1.5,
                    (Math.random() - 0.5) * 1.6
                ),
                life: 1.0,
                isEntity: true
            };
            this.scene.add(p);
            this.hawkState.particles.push(p);
        }

        soundFX.defect();
        if (this.camera) {
            // Camera shake
            this.camera.position.y += 2.0;
        }
    }

    // ==========================================
    // 2. 3D CYBER VAULT DUEL (Matrix Dilemma)
    // ==========================================
    setupMatrixDuelArena() {
        this.camera.position.set(0, 16, 44);
        if (this.controls) this.controls.target.set(0, 4, 0);

        // Cyber Platforms
        const platGeo = new THREE.CylinderGeometry(5, 5.5, 1.5, 32);
        const platMat1 = new THREE.MeshStandardMaterial({ color: 0x00f2fe, metalness: 0.8, roughness: 0.2 });
        const platMat2 = new THREE.MeshStandardMaterial({ color: 0xff0054, metalness: 0.8, roughness: 0.2 });

        const p1Plat = new THREE.Mesh(platGeo, platMat1);
        p1Plat.position.set(-16, 0.75, 0);
        p1Plat.receiveShadow = true;
        p1Plat.userData.isEntity = true;
        this.scene.add(p1Plat);

        const p2Plat = new THREE.Mesh(platGeo, platMat2);
        p2Plat.position.set(16, 0.75, 0);
        p2Plat.receiveShadow = true;
        p2Plat.userData.isEntity = true;
        this.scene.add(p2Plat);

        // Floating Crystals / Avatars
        const avatarGeo = new THREE.OctahedronGeometry(2.5, 0);
        const avMat1 = new THREE.MeshStandardMaterial({ color: 0x00f2fe, wireframe: false, roughness: 0.1 });
        const avMat2 = new THREE.MeshStandardMaterial({ color: 0xff0054, wireframe: false, roughness: 0.1 });

        const av1 = new THREE.Mesh(avatarGeo, avMat1);
        av1.position.set(-16, 5, 0);
        av1.castShadow = true;
        av1.userData = { isEntity: true, floatSpeed: 2, rotSpeed: 0.015 };
        this.scene.add(av1);
        this.vaultState.p1Avatar = av1;

        const av2 = new THREE.Mesh(avatarGeo, avMat2);
        av2.position.set(16, 5, 0);
        av2.castShadow = true;
        av2.userData = { isEntity: true, floatSpeed: 2.2, rotSpeed: -0.015 };
        this.scene.add(av2);
        this.vaultState.p2Avatar = av2;

        // Shields
        const shieldGeo = new THREE.SphereGeometry(3.6, 24, 24);
        const shieldMat1 = new THREE.MeshBasicMaterial({ color: 0x00f5d4, transparent: true, opacity: 0.0, wireframe: true });
        const shieldMat2 = new THREE.MeshBasicMaterial({ color: 0x00f5d4, transparent: true, opacity: 0.0, wireframe: true });

        this.vaultState.p1Shield = new THREE.Mesh(shieldGeo, shieldMat1);
        this.vaultState.p1Shield.position.set(-16, 5, 0);
        this.vaultState.p1Shield.userData.isEntity = true;
        this.scene.add(this.vaultState.p1Shield);

        this.vaultState.p2Shield = new THREE.Mesh(shieldGeo, shieldMat2);
        this.vaultState.p2Shield.position.set(16, 5, 0);
        this.vaultState.p2Shield.userData.isEntity = true;
        this.scene.add(this.vaultState.p2Shield);

        this.update3DHUD("3D Hologram Duel Vault Active. Choose Cooperate (Shield) or Defect (Laser Beam)!");
    }

    triggerVaultDuel(p1Action, p2Action, outcome) {
        // p1Action: 0=Coop, 1=Defect
        // p2Action: 0=Coop, 1=Defect
        if (p1Action === 0) {
            // Activate Shield
            this.vaultState.p1Shield.material.opacity = 0.7;
            setTimeout(() => this.vaultState.p1Shield.material.opacity = 0.0, 1200);
            soundFX.cooperate();
        } else {
            // Fire Laser Beam from P1 to P2
            this.fireLaser(new THREE.Vector3(-16, 5, 0), new THREE.Vector3(16, 5, 0), 0x00f2fe);
            soundFX.defect();
        }

        if (p2Action === 0) {
            this.vaultState.p2Shield.material.opacity = 0.7;
            setTimeout(() => this.vaultState.p2Shield.material.opacity = 0.0, 1200);
        } else {
            this.fireLaser(new THREE.Vector3(16, 5, 0), new THREE.Vector3(-16, 5, 0), 0xff0054);
        }

        this.update3DHUD(`Outcome: You (+${outcome.u1}), AI (+${outcome.u2}) | ${outcome.text}`);
    }

    fireLaser(start, end, colorHex) {
        const dir = new THREE.Vector3().subVectors(end, start);
        const len = dir.length();
        const laserGeo = new THREE.CylinderGeometry(0.35, 0.35, len, 8);
        const laserMat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.9 });
        const laser = new THREE.Mesh(laserGeo, laserMat);

        laser.position.copy(start).add(dir.clone().multiplyScalar(0.5));
        laser.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
        laser.userData.isEntity = true;
        this.scene.add(laser);

        setTimeout(() => {
            this.scene.remove(laser);
            laser.geometry.dispose();
            laser.material.dispose();
        }, 350);
    }

    // ==========================================
    // 3. 3D VOXEL BIOSPHERE (3D God Simulation)
    // ==========================================
    setupVoxelBiosphere() {
        this.camera.position.set(0, 26, 32);
        if (this.controls) this.controls.target.set(0, 0, 0);

        const sz = this.biosphereState.gridSize;
        const spacing = 2.2;
        const offset = (sz * spacing) / 2;

        const colors = {
            always_coop: 0x00f5d4,
            always_defect: 0xff0054,
            tit_for_tat: 0x00f2fe,
            pavlov: 0xffb703
        };

        const keys = Object.keys(colors);
        this.biosphereState.cubes = [];
        this.biosphereState.gridData = [];

        const cubeGeo = new THREE.BoxGeometry(1.8, 1.8, 1.8);

        for (let x = 0; x < sz; x++) {
            this.biosphereState.gridData[x] = [];
            for (let z = 0; z < sz; z++) {
                const strat = keys[Math.floor(Math.random() * keys.length)];
                this.biosphereState.gridData[x][z] = strat;

                const mat = new THREE.MeshStandardMaterial({
                    color: colors[strat],
                    roughness: 0.3,
                    metalness: 0.6
                });

                const mesh = new THREE.Mesh(cubeGeo, mat);
                mesh.position.set(x * spacing - offset, 1.0, z * spacing - offset);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                mesh.userData = {
                    isEntity: true,
                    isVoxel: true,
                    gx: x,
                    gz: z,
                    strategy: strat
                };

                this.scene.add(mesh);
                this.biosphereState.cubes.push(mesh);
            }
        }

        this.update3DHUD("3D Voxel Biosphere. Click on any voxel to inspect its AI strategy or mutate it!");
    }

    stepBiosphere() {
        const sz = this.biosphereState.gridSize;
        const colors = {
            always_coop: 0x00f5d4,
            always_defect: 0xff0054,
            tit_for_tat: 0x00f2fe,
            pavlov: 0xffb703
        };

        const nextGrid = [];
        const mat = [
            [[3, 3], [0, 5]],
            [[5, 0], [1, 1]]
        ];

        // Evaluate scores
        for (let x = 0; x < sz; x++) {
            nextGrid[x] = [];
            for (let z = 0; z < sz; z++) {
                const cur = this.biosphereState.gridData[x][z];
                // Check neighbors
                let bestScore = -999;
                let bestStrat = cur;

                for (let dx = -1; dx <= 1; dx++) {
                    for (let dz = -1; dz <= 1; dz++) {
                        const nx = (x + dx + sz) % sz;
                        const nz = (z + dz + sz) % sz;
                        const nStrat = this.biosphereState.gridData[nx][nz];

                        const s1 = window.STRATEGY_REGISTRY[cur]();
                        const s2 = window.STRATEGY_REGISTRY[nStrat]();
                        const match = GameEngine.runMatch(s1, s2, mat, 3, 0);

                        if (match.p1Score > bestScore) {
                            bestScore = match.p1Score;
                            bestStrat = nStrat;
                        }
                    }
                }
                nextGrid[x][z] = bestStrat;
            }
        }

        this.biosphereState.gridData = nextGrid;
        // Update cube colors and heights
        this.biosphereState.cubes.forEach(cube => {
            const { gx, gz } = cube.userData;
            const strat = nextGrid[gx][gz];
            cube.userData.strategy = strat;
            cube.material.color.setHex(colors[strat] || 0xffffff);
            cube.position.y = 1.0 + Math.sin(Date.now() * 0.003 + gx) * 0.2;
        });

        soundFX.click();
    }

    setupEvents() {
        const dom = this.renderer.domElement;
        dom.addEventListener('click', (e) => {
            if (this.currentMode !== 'voxel_biosphere') return;
            const rect = dom.getBoundingClientRect();
            this.biosphereState.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            this.biosphereState.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

            this.biosphereState.raycaster.setFromCamera(this.biosphereState.mouse, this.camera);
            const intersects = this.biosphereState.raycaster.intersectObjects(this.biosphereState.cubes);

            if (intersects.length > 0) {
                const clicked = intersects[0].object;
                const strat = clicked.userData.strategy;
                soundFX.cooperate();

                // Cycle strategy
                const allKeys = ["always_coop", "always_defect", "tit_for_tat", "pavlov"];
                const next = allKeys[(allKeys.indexOf(strat) + 1) % allKeys.length];
                clicked.userData.strategy = next;
                this.biosphereState.gridData[clicked.userData.gx][clicked.userData.gz] = next;

                const colors = {
                    always_coop: 0x00f5d4,
                    always_defect: 0xff0054,
                    tit_for_tat: 0x00f2fe,
                    pavlov: 0xffb703
                };
                clicked.material.color.setHex(colors[next]);

                // Pulse scale
                clicked.scale.set(1.4, 1.4, 1.4);
                setTimeout(() => clicked.scale.set(1, 1, 1), 200);

                this.update3DHUD(`Mutated Voxel (${clicked.userData.gx}, ${clicked.userData.gz}) to: ${next.toUpperCase()}`);
            }
        });
    }

    update3DHUD(msg) {
        const hud = document.getElementById("hud3DText");
        if (hud) hud.innerHTML = msg;
    }

    // ==========================================
    // RENDER / ANIMATION LOOP
    // ==========================================
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());

        const delta = this.clock.getDelta();
        const time = this.clock.getElapsedTime();

        if (this.controls) this.controls.update();

        // Mode specific animations
        if (this.currentMode === 'hawk_dove' && this.hawkState.phase === 'racing') {
            const ship1 = this.hawkState.p1Ship;
            const ship2 = this.hawkState.p2Ship;

            // Move ships toward center
            ship1.position.z -= 42 * delta;
            ship2.position.z += 42 * delta;

            this.hawkState.distance = Math.abs(ship1.position.z - ship2.position.z);

            // Check swerve threshold
            if (this.hawkState.distance < 24) {
                if (this.hawkState.p1Action === 0) {
                    // P1 swerves to the left (Dove)
                    ship1.position.x = THREE.MathUtils.lerp(ship1.position.x, -5.5, 0.1);
                    ship1.rotation.z = -0.3;
                }
                if (this.hawkState.p2Action === 0) {
                    // P2 swerves to the right (Dove)
                    ship2.position.x = THREE.MathUtils.lerp(ship2.position.x, 5.5, 0.1);
                    ship2.rotation.z = -0.3;
                }
            }

            // Impact check
            if (this.hawkState.distance < 3) {
                this.hawkState.phase = 'result';
                const p1 = this.hawkState.p1Action;
                const p2 = this.hawkState.p2Action;

                if (p1 === 1 && p2 === 1) {
                    // BOTH HAWK: CATASTROPHIC CRASH!
                    this.createExplosion(new THREE.Vector3(0, 1.2, 0));
                    this.update3DHUD("💥 CATASTROPHIC HEAD-ON COLLISION! Both stayed as Hawks: (-10, -10) Mutual Destruction!");
                } else if (p1 === 1 && p2 === 0) {
                    // P1 Hawk, P2 Dove
                    this.update3DHUD("🏆 You Stayed Straight (Hawk)! Opponent swerved (Dove). You win glory (+5, +1)!");
                    soundFX.roundWin();
                } else if (p1 === 0 && p2 === 1) {
                    // P1 Dove, P2 Hawk
                    this.update3DHUD("🕊️ You Swerved (Dove)! Opponent sped through as Hawk (+1, +5). You avoided disaster!");
                    soundFX.roundDraw();
                } else {
                    // Both Dove
                    this.update3DHUD("🤝 Both Swerved Peacefully (Doves)! Mutual safety and face saved (+3, +3)!");
                    soundFX.roundWin();
                }
            }
        }

        // Particle updates
        for (let i = this.hawkState.particles.length - 1; i >= 0; i--) {
            const p = this.hawkState.particles[i];
            p.position.add(p.userData.vel);
            p.userData.life -= delta * 1.5;
            p.scale.multiplyScalar(0.97);
            if (p.userData.life <= 0) {
                this.scene.remove(p);
                this.hawkState.particles.splice(i, 1);
            }
        }

        // Vault Avatar floating rotation
        if (this.currentMode === 'matrix_duel') {
            if (this.vaultState.p1Avatar) {
                this.vaultState.p1Avatar.rotation.y += 0.015;
                this.vaultState.p1Avatar.position.y = 5 + Math.sin(time * 2.5) * 0.4;
            }
            if (this.vaultState.p2Avatar) {
                this.vaultState.p2Avatar.rotation.y -= 0.015;
                this.vaultState.p2Avatar.position.y = 5 + Math.cos(time * 2.5) * 0.4;
            }
        }

        this.renderer.render(this.scene, this.camera);
    }
}

window.Arena3D = Arena3D;
