import { Component, ElementRef, ViewChild, AfterViewInit, signal, OnDestroy, PLATFORM_ID, inject, computed } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface Project {
  id: string;
  name: string;
  description: string;
  techStack: string[];
  problem?: string;
  solution?: string;
  result?: string;
  resultMetric?: string;
  demoLink?: string;
  demoActionText?: string;
  playStoreLink?: string;
  appStoreLink?: string;
}

interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar: string;
  rating: number;
  quote: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  avatar: string;
  xHandle?: string;
  linkedinHandle?: string;
}

// (TeamMember kept but team array removed — will restore when founders are ready)

@Component({
  selector: 'app-root',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements AfterViewInit, OnDestroy {
  @ViewChild('canvasContainer', { static: true }) canvasContainer!: ElementRef<HTMLDivElement>;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private animationFrameId?: number;

  // 3D Objects
  private smartphoneGroup!: THREE.Group;
  private browserGroup!: THREE.Group;
  private serverCube!: THREE.Group;
  private aiCube!: THREE.Group;
  private particles!: THREE.Points;
  private ambientEnergy!: THREE.Mesh;
  private gltfLoader = new GLTFLoader();

  // Lights
  private pointLight1!: THREE.PointLight;
  private pointLight2!: THREE.PointLight;

  // Interaction
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private interactiveObjects: { object: THREE.Object3D, projectId: string }[] = [];
  private hoveredProjectId: string | null = null;
  private targetCameraPos = new THREE.Vector3(0, 2, 15);
  private currentLookAt = new THREE.Vector3(0, 0, -10);
  private targetLookAt = new THREE.Vector3(0, 0, -10);
  private particleConfig = {
    count: 2500,
    baseSpeed: 0.02,
    scrollMultiplier: 0.05
  };

  // State
  activeProject = signal<Project | null>(null);
  isModalClosing = signal(false);
  isMobileMenuOpen = signal(false);
  scrollY = signal(0);
  scrollProgress = signal(0);
  isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  isMessageSent = signal(false);
  isSending = signal(false);

  // Book a Call modal
  bookCallOpen = signal(false);
  bookCallSent = signal(false);
  isBookCallSending = signal(false);

  // Legal modals
  showPrivacyPolicy = signal(false);
  showTerms = signal(false);

  // Cookie consent
  showCookieBanner = signal(false);

  // Sticky CTA: show after scrolling 600px past hero
  showStickyCta = computed(() => this.scrollY() > 600);

  private fb = inject(FormBuilder);
  contactForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    company: [''],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    service: ['', Validators.required],
    budget: [''],
    message: ['', [Validators.required, Validators.minLength(10)]]
  });

  bookCallForm: FormGroup = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.required, Validators.pattern(/^[\+]?[0-9\s\-]{7,15}$/)]], 
    preferredDate: ['', Validators.required],
    preferredTime: ['', Validators.required]
  });

  projects: Project[] = [
    {
      id: 'my-voters-hub',
      name: 'My Voters Hub',
      description: 'A comprehensive mobile solution for political campaign management, team coordination, and real-time voter analytics. Available on Play Store and App Store.',
      techStack: ['Dart', 'Flutter', 'Supabase'],
      problem: 'Campaign managers were drowning in spreadsheets, losing track of voter data across multiple volunteers with no real-time coordination.',
      solution: 'Built a Flutter mobile app with real-time Supabase sync, live voter map, volunteer task management, and instant push alerts for field teams.',
      result: 'Campaign teams reduced coordination time by 60% and increased voter outreach by 3× in the first election cycle.',
      resultMetric: '3× Voter Outreach',
      demoLink: 'https://myvotershub-download.netlify.app/',
      playStoreLink: 'https://play.google.com/store/apps/details?id=com.myvotershub.app&hl=en_IN',
      appStoreLink: 'https://apps.apple.com/in/app/my-voters-hub/id6758681852'
    },
    {
      id: 'crm-dashboard',
      name: 'CRM Dashboard',
      description: 'Enterprise-grade customer relationship management platform with real-time analytics.',
      techStack: ['React', 'Next.js', 'GraphQL'],
      problem: 'A staffing firm was using 3 disconnected tools (email, Excel, and Slack) to manage client pipelines, causing deals to fall through the cracks.',
      solution: 'Delivered a custom CRM with GraphQL-powered real-time dashboards, automated follow-up reminders, and a unified pipeline view.',
      result: 'Close rate improved by 40% in the first quarter post-launch; deal visibility went from zero to 100% of the pipeline.',
      resultMetric: '40% Higher Close Rate',
      demoLink: 'https://crm-staffing.netlify.app/'
    },
    {
      id: 'one-rider',
      name: 'One Rider',
      description: 'Multi-platform ride aggregator connecting users with the best travel options across providers.',
      techStack: ['Swift', 'Kotlin', 'Flutter', 'Node.js', 'PostgreSQL', 'Supabase', 'Firebase'],
      problem: 'Commuters in metro cities were juggling 4+ ride apps to compare prices, wasting 10+ minutes per ride just on app-switching.',
      solution: 'Architected a native iOS/Android aggregator with real-time price comparison, unified booking flow, and a single wallet across providers.',
      result: 'Alpha testing showed average booking time dropped from 8 minutes to under 90 seconds per user session.',
      resultMetric: '90s Booking Time',
      demoActionText: 'Coming Soon!'
    },
    {
      id: 'ai-automation',
      name: 'AI Automation Integration',
      description: 'Intelligent workflow automation powered by advanced machine learning models.',
      techStack: ['Python', 'TensorFlow', 'FastAPI'],
      problem: 'An e-commerce ops team was manually processing 500+ customer support tickets daily, with 4-hour average response times.',
      solution: 'Deployed a custom LLM-powered AI agent integrated via FastAPI that auto-classifies, drafts, and triages tickets with human review gates.',
      result: 'Average response time cut from 4 hours to 12 minutes. 78% of tickets resolved without any human intervention.',
      resultMetric: '78% Auto-Resolution',
      demoActionText: 'Contact us for more information'
    },
    {
      id: 'mobile-apps',
      name: 'Mobile Applications',
      description: 'High-performance native and cross-platform mobile experiences for startups and enterprises.',
      techStack: ['Swift', 'Kotlin', 'React Native'],
      problem: 'Startups were spending $80k+ and 9+ months building separate iOS and Android apps with agencies that didn\'t understand their MVP priorities.',
      solution: 'Streamlined delivery with our 14-day MVP sprint framework — shared logic in React Native with native performance bridges where needed.',
      result: 'Clients launched market-ready apps in 14–21 days at 60% less cost than traditional agency quotes, securing seed funding faster.',
      resultMetric: '14-Day Launch',
      demoActionText: 'Contact us for more information'
    },
    {
      id: 'web-platforms',
      name: 'Web Platforms',
      description: 'Scalable, secure, and accessible web applications for modern businesses.',
      techStack: ['Angular', 'TypeScript', 'Tailwind CSS'],
      problem: 'Growing SaaS companies were bottlenecked by legacy monoliths that took weeks to deploy a single feature update.',
      solution: 'Rebuilt with Angular SSR, modular architecture, and CI/CD pipelines that enable daily deploys and independent team scaling.',
      result: 'Deployment frequency went from bi-weekly to daily. Page load scores jumped from 42 to 94 on Google Lighthouse.',
      resultMetric: '94 Lighthouse Score',
      demoActionText: 'Contact us for more information'
    }
  ];

  testimonials: Testimonial[] = [
    {
      id: 't1',
      name: 'Arjun Mehta',
      role: 'Founder & CEO',
      company: 'VoteStream',
      avatar: 'AM',
      rating: 5,
      quote: 'Ham Tech delivered our mobile app in 18 days. I\'ve worked with three agencies before — none came close to their speed or code quality. The team genuinely cares about the product, not just the invoice.'
    },
    {
      id: 't2',
      name: 'Sarah O\'Brien',
      role: 'Head of Operations',
      company: 'NexStaff Solutions',
      avatar: 'SO',
      rating: 5,
      quote: 'Our custom CRM has completely transformed how we manage client relationships. The real-time dashboard is something our old agency said would take 6 months — Ham Tech built it in 3 weeks.'
    },
    {
      id: 't3',
      name: 'Priya Chatterjee',
      role: 'CTO',
      company: 'Finlayer',
      avatar: 'PC',
      rating: 5,
      quote: 'The AI automation agents they built handle 80% of our support load. ROI in the first month was insane. These guys are the real deal — deep technical expertise without the big agency attitude.'
    }
  ];

  team: TeamMember[] = [];
  // (Team section hidden until founders are ready)

  techStack = ['Dart', 'Swift', 'Kotlin', 'Flutter', 'React', 'Next.js', 'Node.js', 'Angular', 'Python', 'TensorFlow', 'PostgreSQL', 'GraphQL', 'Supabase', 'Firebase', 'Tailwind CSS'];

  private onWindowResizeBound = this.onWindowResize.bind(this);
  private onScrollBound = this.onScroll.bind(this);

  ngAfterViewInit() {
    if (this.isBrowser) {
      this.initThreeJs();
      window.addEventListener('scroll', this.onScrollBound);
      // Cookie consent
      const cookiesAccepted = localStorage.getItem('ht_cookies_accepted');
      if (!cookiesAccepted) {
        setTimeout(() => this.showCookieBanner.set(true), 2000);
      }
    }
  }

  ngOnDestroy() {
    if (this.isBrowser) {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
      window.removeEventListener('resize', this.onWindowResizeBound);
      window.removeEventListener('scroll', this.onScrollBound);
      this.renderer?.dispose();
    }
  }

  onScroll() {
    if (this.isBrowser) {
      this.scrollY.set(window.scrollY);
      const progress = Math.min(window.scrollY / (document.body.scrollHeight - window.innerHeight), 1) * 100;
      this.scrollProgress.set(progress);
    }
  }

  private initThreeJs() {
    const container = this.canvasContainer.nativeElement;

    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0xf8fafc, 0.025);

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.z = 15;
    this.camera.position.y = 2;

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
      stencil: false,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(this.renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);

    this.pointLight1 = new THREE.PointLight(0x818cf8, 1.5, 50);
    this.pointLight1.position.set(5, 5, 5);
    this.scene.add(this.pointLight1);

    this.pointLight2 = new THREE.PointLight(0x94a3b8, 1.5, 50);
    this.pointLight2.position.set(-5, -5, 5);
    this.scene.add(this.pointLight2);

    // Create Objects
    this.createObjects();
    this.createParticles();
    this.createAmbientEnergy();

    // Event Listeners
    window.addEventListener('resize', this.onWindowResizeBound);
    container.addEventListener('mousemove', this.onCanvasMouseMove.bind(this));
    container.addEventListener('click', this.onCanvasClick.bind(this));

    // Animation Loop
    this.animate();
  }

  private loadCustomModel(url: string, fallbackGroup: THREE.Group, scale = 1) {
    this.gltfLoader.load(
      url,
      (gltf) => {
        const model = gltf.scene;
        model.scale.setScalar(scale);
        fallbackGroup.clear();
        fallbackGroup.add(model);
      },
      undefined,
      (error) => {
        console.warn(`Failed to load custom model from ${url}. Using procedural fallback.`, error);
      }
    );
  }

  private createObjects() {
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.1,
      roughness: 0.4,
      transparent: true,
      opacity: 0.9,
      envMapIntensity: 1.0,
      clearcoat: 0.5,
      clearcoatRoughness: 0.2,
    });

    const textureLoader = new THREE.TextureLoader();

    const phoneTexture = textureLoader.load('/models/phone_ui.png');
    phoneTexture.colorSpace = THREE.SRGBColorSpace;
    phoneTexture.minFilter = THREE.LinearMipmapLinearFilter;
    phoneTexture.generateMipmaps = true;
    phoneTexture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    phoneTexture.repeat.set(0.6, 0.65);
    phoneTexture.offset.set(0.2, 0.15);

    const browserTexture = textureLoader.load('/models/browser_ui.png');
    browserTexture.colorSpace = THREE.SRGBColorSpace;
    browserTexture.minFilter = THREE.LinearMipmapLinearFilter;
    browserTexture.generateMipmaps = true;
    browserTexture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    browserTexture.repeat.set(0.9, 0.9);
    browserTexture.offset.set(0.05, 0.05);

    const serverTexture = textureLoader.load('/models/server_front.png');
    serverTexture.colorSpace = THREE.SRGBColorSpace;
    serverTexture.minFilter = THREE.LinearMipmapLinearFilter;
    serverTexture.generateMipmaps = true;
    serverTexture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();

    const aiCoreTexture = textureLoader.load('/models/ai_core.png');
    aiCoreTexture.colorSpace = THREE.SRGBColorSpace;
    aiCoreTexture.minFilter = THREE.LinearMipmapLinearFilter;
    aiCoreTexture.generateMipmaps = true;
    aiCoreTexture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();

    // 1. Smartphone (Mobile Apps)
    this.smartphoneGroup = new THREE.Group();
    const lodPhone = new THREE.LOD();
    const phoneHigh = new THREE.Group();

    const phoneShape = new THREE.Shape();
    const width = 2.0;
    const height = 4.2;
    const radius = 0.25;
    phoneShape.moveTo(-width/2 + radius, -height/2);
    phoneShape.lineTo(width/2 - radius, -height/2);
    phoneShape.quadraticCurveTo(width/2, -height/2, width/2, -height/2 + radius);
    phoneShape.lineTo(width/2, height/2 - radius);
    phoneShape.quadraticCurveTo(width/2, height/2, width/2 - radius, height/2);
    phoneShape.lineTo(-width/2 + radius, height/2);
    phoneShape.quadraticCurveTo(-width/2, height/2, -width/2, height/2 - radius);
    phoneShape.lineTo(-width/2, -height/2 + radius);
    phoneShape.quadraticCurveTo(-width/2, -height/2, -width/2 + radius, -height/2);

    const extrudeSettings = { depth: 0.15, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.02, bevelThickness: 0.02 };
    const phoneGeo = new THREE.ExtrudeGeometry(phoneShape, extrudeSettings);

    const phoneChassisMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      roughness: 0.3,
      metalness: 0.8,
      clearcoat: 0.2
    });

    const phoneBase = new THREE.Mesh(phoneGeo, phoneChassisMat);
    phoneBase.position.z = -0.075;
    phoneHigh.add(phoneBase);

    const screenShape = new THREE.Shape();
    const sWidth = 1.9;
    const sHeight = 4.0;
    const sRadius = 0.2;
    screenShape.moveTo(-sWidth/2 + sRadius, -sHeight/2);
    screenShape.lineTo(sWidth/2 - sRadius, -sHeight/2);
    screenShape.quadraticCurveTo(sWidth/2, -sHeight/2, sWidth/2, -sHeight/2 + sRadius);
    screenShape.lineTo(sWidth/2, sHeight/2 - sRadius);
    screenShape.quadraticCurveTo(sWidth/2, sHeight/2, sWidth/2 - sRadius, sHeight/2);
    screenShape.lineTo(-sWidth/2 + sRadius, sHeight/2);
    screenShape.quadraticCurveTo(-sWidth/2, sHeight/2, -sWidth/2, sHeight/2 - sRadius);
    screenShape.lineTo(-sWidth/2, -sHeight/2 + sRadius);
    screenShape.quadraticCurveTo(-sWidth/2, -sHeight/2, -sWidth/2 + sRadius, -sHeight/2);

    const screenGeo = new THREE.ShapeGeometry(screenShape);

    const uvs = [];
    const positions = screenGeo.attributes['position'].array;
    for (let i = 0; i < positions.length; i += 3) {
      const u = (positions[i] + sWidth / 2) / sWidth;
      const v = (positions[i + 1] + sHeight / 2) / sHeight;
      uvs.push(u, v);
    }
    screenGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

    const screen = new THREE.Mesh(screenGeo, new THREE.MeshBasicMaterial({ map: phoneTexture, color: 0xffffff }));
    screen.position.z = 0.11;
    phoneHigh.add(screen);
    const phoneLow = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 0.2), phoneChassisMat);
    lodPhone.addLevel(phoneHigh, 0);
    lodPhone.addLevel(phoneLow, 20);
    this.smartphoneGroup.add(lodPhone);
    this.smartphoneGroup.position.set(-6, 0, -5);
    this.scene.add(this.smartphoneGroup);
    this.interactiveObjects.push({ object: this.smartphoneGroup, projectId: 'mobile-apps' });
    this.loadCustomModel('/assets/models/smartphone.glb', this.smartphoneGroup, 1);

    // 2. Browser Window (Web Platforms)
    this.browserGroup = new THREE.Group();
    const lodBrowser = new THREE.LOD();
    const browserHigh = new THREE.Group();

    const browserShape = new THREE.Shape();
    const bWidth = 5.2;
    const bHeight = 3.2;
    const bRadius = 0.15;
    browserShape.moveTo(-bWidth/2 + bRadius, -bHeight/2);
    browserShape.lineTo(bWidth/2 - bRadius, -bHeight/2);
    browserShape.quadraticCurveTo(bWidth/2, -bHeight/2, bWidth/2, -bHeight/2 + bRadius);
    browserShape.lineTo(bWidth/2, bHeight/2 - bRadius);
    browserShape.quadraticCurveTo(bWidth/2, bHeight/2, bWidth/2 - bRadius, bHeight/2);
    browserShape.lineTo(-bWidth/2 + bRadius, bHeight/2);
    browserShape.quadraticCurveTo(-bWidth/2, bHeight/2, -bWidth/2, bHeight/2 - bRadius);
    browserShape.lineTo(-bWidth/2, -bHeight/2 + bRadius);
    browserShape.quadraticCurveTo(-bWidth/2, -bHeight/2, -bWidth/2 + bRadius, -bHeight/2);

    const bExtrudeSettings = { depth: 0.1, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.01, bevelThickness: 0.01 };
    const browserGeo = new THREE.ExtrudeGeometry(browserShape, bExtrudeSettings);

    const browserFrameMat = new THREE.MeshPhysicalMaterial({
      color: 0x334155,
      roughness: 0.2,
      metalness: 0.5,
      clearcoat: 0.8,
      transparent: false,
      opacity: 1.0
    });

    const browserBase = new THREE.Mesh(browserGeo, browserFrameMat);
    browserBase.position.z = -0.05;
    browserHigh.add(browserBase);

    const bScreenWidth = 5.0;
    const bScreenHeight = 2.9;
    const bScreenRadius = 0.1;
    const bScreenShape = new THREE.Shape();
    bScreenShape.moveTo(-bScreenWidth/2 + bScreenRadius, -bScreenHeight/2);
    bScreenShape.lineTo(bScreenWidth/2 - bScreenRadius, -bScreenHeight/2);
    bScreenShape.quadraticCurveTo(bScreenWidth/2, -bScreenHeight/2, bScreenWidth/2, -bScreenHeight/2 + bScreenRadius);
    bScreenShape.lineTo(bScreenWidth/2, bScreenHeight/2 - bScreenRadius);
    bScreenShape.quadraticCurveTo(bScreenWidth/2, bScreenHeight/2, bScreenWidth/2 - bScreenRadius, bScreenHeight/2);
    bScreenShape.lineTo(-bScreenWidth/2 + bScreenRadius, bScreenHeight/2);
    bScreenShape.quadraticCurveTo(-bScreenWidth/2, bScreenHeight/2, -bScreenWidth/2, bScreenHeight/2 - bScreenRadius);
    bScreenShape.lineTo(-bScreenWidth/2, -bScreenHeight/2 + bScreenRadius);
    bScreenShape.quadraticCurveTo(-bScreenWidth/2, -bScreenHeight/2, -bScreenWidth/2 + bScreenRadius, -bScreenHeight/2);

    const bScreenGeo = new THREE.ShapeGeometry(bScreenShape);

    const bUvs = [];
    const bPositions = bScreenGeo.attributes['position'].array;
    for (let i = 0; i < bPositions.length; i += 3) {
      const u = (bPositions[i] + bScreenWidth / 2) / bScreenWidth;
      const v = (bPositions[i + 1] + bScreenHeight / 2) / bScreenHeight;
      bUvs.push(u, v);
    }
    bScreenGeo.setAttribute('uv', new THREE.Float32BufferAttribute(bUvs, 2));

    const browserContent = new THREE.Mesh(bScreenGeo, new THREE.MeshBasicMaterial({ map: browserTexture, color: 0xffffff }));
    browserContent.position.set(0, -0.05, 0.051);
    browserHigh.add(browserContent);

    const browserLow = new THREE.Mesh(new THREE.BoxGeometry(5, 3, 0.1), browserFrameMat);
    lodBrowser.addLevel(browserHigh, 0);
    lodBrowser.addLevel(browserLow, 20);
    this.browserGroup.add(lodBrowser);
    this.browserGroup.position.set(6, 2, -8);
    this.scene.add(this.browserGroup);
    this.interactiveObjects.push({ object: this.browserGroup, projectId: 'web-platforms' });
    this.loadCustomModel('/assets/models/browser.glb', this.browserGroup, 1);

    // 3. Server Cube (CRM)
    this.serverCube = new THREE.Group();
    const lodServer = new THREE.LOD();
    const serverHigh = new THREE.Group();
    const serverSideMat = new THREE.MeshBasicMaterial({ map: serverTexture, color: 0xffffff });
    const serverMats = [
        serverSideMat,
        serverSideMat,
        material,
        material,
        serverSideMat,
        serverSideMat
    ];
    for(let i=0; i<3; i++) {
        const blade = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 2.4), serverMats);
        blade.position.y = (i - 1) * 1.5;
        serverHigh.add(blade);
    }
    const serverLow = new THREE.Mesh(new THREE.BoxGeometry(2, 5, 2), material);
    lodServer.addLevel(serverHigh, 0);
    lodServer.addLevel(serverLow, 20);
    this.serverCube.add(lodServer);
    this.serverCube.position.set(-4, -3, -10);
    this.scene.add(this.serverCube);
    this.interactiveObjects.push({ object: this.serverCube, projectId: 'crm-dashboard' });
    this.loadCustomModel('/assets/models/server.glb', this.serverCube, 1);

    // 4. AI Core
    this.aiCube = new THREE.Group();
    const lodAI = new THREE.LOD();
    const aiHigh = new THREE.Group();

    const sphereMaterial = new THREE.MeshStandardMaterial({
      map: aiCoreTexture,
      emissive: new THREE.Color(0x4f46e5),
      emissiveIntensity: 0.2,
      emissiveMap: aiCoreTexture,
      roughness: 0.2,
      metalness: 0.8
    });

    aiHigh.add(new THREE.Mesh(new THREE.SphereGeometry(1.6, 64, 64), sphereMaterial));

    const aiLow = new THREE.Mesh(new THREE.SphereGeometry(1.6, 16, 16), sphereMaterial);
    lodAI.addLevel(aiHigh, 0);
    lodAI.addLevel(aiLow, 20);
    this.aiCube.add(lodAI);
    this.aiCube.position.set(4, -2, -6);
    this.scene.add(this.aiCube);
    this.interactiveObjects.push({ object: this.aiCube, projectId: 'ai-automation' });
    this.loadCustomModel('/assets/models/ai_core.glb', this.aiCube, 1);
  }

  private createParticles() {
    const particlesGeo = new THREE.BufferGeometry();
    const particlesCount = this.particleConfig.count;
    const posArray = new Float32Array(particlesCount * 3);
    const colorsArray = new Float32Array(particlesCount * 3);

    const color1 = new THREE.Color(0x6366f1);
    const color2 = new THREE.Color(0x2563eb);
    const color3 = new THREE.Color(0x3b82f6);

    for (let i = 0; i < particlesCount; i++) {
      posArray[i * 3] = (Math.random() - 0.5) * 60;
      posArray[i * 3 + 1] = (Math.random() - 0.5) * 60;
      posArray[i * 3 + 2] = (Math.random() - 0.5) * 60;

      const rand = Math.random();
      const mixedColor = rand < 0.33 ? color1 : (rand < 0.66 ? color2 : color3);

      colorsArray[i * 3] = mixedColor.r;
      colorsArray[i * 3 + 1] = mixedColor.g;
      colorsArray[i * 3 + 2] = mixedColor.b;
    }

    particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeo.setAttribute('color', new THREE.BufferAttribute(colorsArray, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.NormalBlending,
      sizeAttenuation: true
    });

    this.particles = new THREE.Points(particlesGeo, particlesMaterial);
    this.scene.add(this.particles);
  }

  private createAmbientEnergy() {
    const energyGeo = new THREE.TorusKnotGeometry(15, 3, 100, 16);
    const energyMat = new THREE.MeshBasicMaterial({
      color: 0x2563eb,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
      blending: THREE.NormalBlending
    });
    this.ambientEnergy = new THREE.Mesh(energyGeo, energyMat);
    this.ambientEnergy.position.set(0, 0, -20);
    this.scene.add(this.ambientEnergy);
  }

  private onCanvasMouseMove(event: MouseEvent) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveObjects.map(io => io.object), true);

    if (intersects.length > 0) {
      document.body.style.cursor = 'pointer';
      let intersectedObject: THREE.Object3D | null = intersects[0].object;
      let matchedProjectId: string | null = null;

      while (intersectedObject) {
        const match = this.interactiveObjects.find(io => io.object === intersectedObject);
        if (match) {
          matchedProjectId = match.projectId;
          break;
        }
        intersectedObject = intersectedObject.parent;
      }
      this.hoveredProjectId = matchedProjectId;
    } else {
      document.body.style.cursor = 'default';
      this.hoveredProjectId = null;
    }
  }

  private onCanvasClick(event: MouseEvent) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveObjects.map(io => io.object), true);

    if (intersects.length > 0) {
      let intersectedObject: THREE.Object3D | null = intersects[0].object;
      let matchedProjectId: string | null = null;

      while (intersectedObject) {
        const match = this.interactiveObjects.find(io => io.object === intersectedObject);
        if (match) {
          matchedProjectId = match.projectId;
          break;
        }
        intersectedObject = intersectedObject.parent;
      }

      if (matchedProjectId) {
        const project = this.projects.find(p => p.id === matchedProjectId);
        if (project) {
          this.openProject(project);
        }
      }
    }
  }

  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    const time = Date.now() * 0.001;

    // Emissive hover effect
    this.interactiveObjects.forEach(io => {
      const isHovered = io.projectId === this.hoveredProjectId;
      io.object.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material && 'emissive' in child.material) {
          const mat = child.material as THREE.MeshPhysicalMaterial;
          const targetEmissive = isHovered ? new THREE.Color(0x4f46e5) : new THREE.Color(0x000000);
          mat.emissive.lerp(targetEmissive, 0.1);
          mat.emissiveIntensity = isHovered ? 0.3 : 0;
        }
      });
    });

    // Dynamic Light Shifts
    if (this.pointLight1 && this.pointLight2) {
      this.pointLight1.position.x = Math.sin(time * 0.5) * 10;
      this.pointLight1.position.z = Math.cos(time * 0.5) * 10;
      this.pointLight2.position.x = Math.cos(time * 0.3) * 10;
      this.pointLight2.position.z = Math.sin(time * 0.3) * 10;
    }

    // Ambient Energy Flow
    if (this.ambientEnergy) {
      this.ambientEnergy.rotation.x = time * 0.05;
      this.ambientEnergy.rotation.y = time * 0.08;
    }

    const getHoverScale = (id: string) => this.hoveredProjectId === id ? 1.15 : 1.0;

    if (this.smartphoneGroup) {
      this.smartphoneGroup.rotation.y = Math.sin(time * 0.3) * 0.2;
      this.smartphoneGroup.rotation.x = Math.cos(time * 0.3) * 0.1;
      this.smartphoneGroup.position.y = Math.sin(time * 1.5) * 0.3;
      const targetScale = getHoverScale('mobile-apps') * (1 + Math.sin(time * 2) * 0.02);
      this.smartphoneGroup.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }

    if (this.browserGroup) {
      this.browserGroup.rotation.y = time * 0.2;
      this.browserGroup.rotation.z = Math.sin(time * 0.4) * 0.1;
      this.browserGroup.position.y = 2 + Math.cos(time * 1.2) * 0.4;
      const targetScale = getHoverScale('web-platforms') * (1 + Math.cos(time * 1.8) * 0.02);
      this.browserGroup.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }

    if (this.serverCube) {
      this.serverCube.rotation.y = time * 0.3;
      this.serverCube.rotation.z = Math.sin(time * 0.2) * 0.1;
      this.serverCube.position.y = -3 + Math.sin(time * 1.1) * 0.3;
      const targetScale = getHoverScale('crm-dashboard');
      this.serverCube.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }

    if (this.aiCube) {
      this.aiCube.rotation.x = time * 0.5;
      this.aiCube.rotation.y = time * 0.4;
      this.aiCube.position.y = -2 + Math.cos(time * 1.4) * 0.3;
      const targetScale = getHoverScale('ai-automation') * (1 + Math.sin(time * 3) * 0.05);
      this.aiCube.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);

      const lod = this.aiCube.children[0] as THREE.LOD;
      if (lod && lod.levels && lod.levels[0]) {
        const highGroup = lod.levels[0].object;
        if (highGroup.children.length > 2) {
           highGroup.children[2].rotation.x = -time * 1.5;
           highGroup.children[2].rotation.y = -time * 1.2;
        }
      }
    }

    // Dynamic Particle Flow
    if (this.particles) {
      this.particles.rotation.y = time * 0.05 + this.mouse.x * 0.1;
      this.particles.rotation.x = this.mouse.y * 0.1;

      const positions = this.particles.geometry.attributes['position'].array as Float32Array;
      const scrollOffset = this.scrollY() * 0.001;

      for (let i = 1; i < positions.length; i += 3) {
        positions[i] += this.particleConfig.baseSpeed + (scrollOffset * this.particleConfig.scrollMultiplier);
        if (positions[i] > 30) {
          positions[i] = -30;
        }
      }
      this.particles.geometry.attributes['position'].needsUpdate = true;
    }

    // Camera parallax based on scroll
    const scrollPercent = Math.min(this.scrollY() / (document.body.scrollHeight - window.innerHeight), 1);

    this.targetCameraPos.z = 15 - (scrollPercent * 20);
    this.targetCameraPos.y = 2 - (scrollPercent * 5);
    this.targetCameraPos.x = Math.sin(scrollPercent * Math.PI) * 2;

    this.targetLookAt.x = Math.sin(scrollPercent * Math.PI) * -2;
    this.targetLookAt.y = -scrollPercent * 5;
    this.targetLookAt.z = -10;

    this.camera.position.lerp(this.targetCameraPos, 0.05);
    this.currentLookAt.lerp(this.targetLookAt, 0.05);
    this.camera.lookAt(this.currentLookAt);

    this.renderer.render(this.scene, this.camera);
  }

  openProject(project: Project) {
    this.activeProject.set(project);
    this.isModalClosing.set(false);
  }

  closeProject() {
    this.isModalClosing.set(true);
    setTimeout(() => {
      this.activeProject.set(null);
      this.isModalClosing.set(false);
    }, 300);
  }

  getTechColorClass(index: number): string {
    const colors = [
      'text-indigo-600 border-indigo-200 bg-indigo-50',
      'text-slate-600 border-slate-200 bg-slate-50',
      'text-indigo-600 border-indigo-200 bg-indigo-50'
    ];
    return colors[index % colors.length];
  }

  openBookCall() {
    this.bookCallOpen.set(true);
    this.bookCallSent.set(false);
    this.bookCallForm.reset();
  }

  closeBookCall() {
    this.bookCallOpen.set(false);
  }

  async submitBookCall() {
    if (this.bookCallForm.valid && !this.isBookCallSending()) {
      this.isBookCallSending.set(true);
      try {
        const v = this.bookCallForm.value;
        await fetch('https://formsubmit.co/ajax/contactus@hamtechinnovations.com', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            _subject: `Call Request from ${v.fullName}`,
            full_name: v.fullName,
            phone: v.phone,
            preferred_date: v.preferredDate,
            preferred_time: v.preferredTime
          })
        });
        this.bookCallSent.set(true);
        setTimeout(() => this.closeBookCall(), 4000);
      } catch {
        this.bookCallSent.set(true); // still show success UX
        setTimeout(() => this.closeBookCall(), 4000);
      } finally {
        this.isBookCallSending.set(false);
      }
    } else {
      this.bookCallForm.markAllAsTouched();
    }
  }

  acceptCookies() {
    if (this.isBrowser) localStorage.setItem('ht_cookies_accepted', '1');
    this.showCookieBanner.set(false);
  }

  scrollTo(sectionId: string) {
    if (this.isBrowser) {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen.update(v => !v);
  }

  /** Pre-fills the service dropdown and scrolls to contact form */
  claimAudit() {
    this.contactForm.patchValue({ service: 'Website Development', message: 'I\'d like to claim my free website audit.' });
    this.scrollTo('contact');
  }

  async onSubmit() {
    if (this.contactForm.valid && !this.isSending()) {
      this.isSending.set(true);

      try {
        const v = this.contactForm.value;
        const response = await fetch("https://formsubmit.co/ajax/contactus@hamtechinnovations.com", {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            name: v.name,
            company: v.company || 'N/A',
            email: v.email,
            phone: v.phone || 'N/A',
            service_interested_in: v.service,
            budget: v.budget || 'Not specified',
            message: v.message,
            _subject: `New Project Inquiry from ${v.name} — Ham Tech Innovations`
          })
        });

        if (response.ok) {
          this.isMessageSent.set(true);
          setTimeout(() => {
            this.isMessageSent.set(false);
          }, 5000);
          this.contactForm.reset();
        } else {
          alert("Something went wrong. Please try again later.");
        }
      } catch (error) {
        alert("Network error. Please try again later.");
      } finally {
        this.isSending.set(false);
      }
    } else {
      this.contactForm.markAllAsTouched();
    }
  }
}
