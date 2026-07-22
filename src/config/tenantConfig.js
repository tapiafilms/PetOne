// SaaS Whitelabel Tenant Configuration Manager for PetOne PWA
export const TENANTS = {
  default: {
    id: 'default',
    name: 'PetOne',
    logo: '/logo-petone.png',
    colors: {
      primary: '238, 79%, 60%',    // Indigo: #4f46e5
      secondary: '161, 84%, 41%',  // Esmeralda: #10b981
      accent: '37, 93%, 53%'       // Naranja/Oro: #f59e0b
    },
    branches: [
      { name: 'PetOne Providencia', address: 'Av. Providencia 1482', delay: 'Listo en 30 min' },
      { name: 'PetOne Vitacura', address: 'Av. Vitacura 4900', delay: 'Listo en 45 min' },
      { name: 'PetOne Santiago Centro', address: 'Av. Libertador O\'Higgins 390', delay: 'Listo en 1 hora' }
    ]
  },
  superzoo: {
    id: 'superzoo',
    name: 'SuperZoo',
    logo: '/logo-petone.png', // Dynamic rendering overrides this
    colors: {
      primary: '28, 91%, 54%',     // Naranja cálido: #ea580c
      secondary: '47, 95%, 48%',   // Amarillo dorado: #ca8a04
      accent: '199, 89%, 48%'      // Azul cielo: #0ea5e9
    },
    branches: [
      { name: 'SuperZoo Las Condes', address: 'Av. Las Condes 9800', delay: 'Listo en 20 min' },
      { name: 'SuperZoo Ñuñoa', address: 'Av. Irarrázaval 2400', delay: 'Listo en 30 min' },
      { name: 'SuperZoo Mall Plaza Egaña', address: 'Av. Larraín 5862', delay: 'Listo en 45 min' }
    ]
  },
  petcity: {
    id: 'petcity',
    name: 'PetCity',
    logo: '/logo-petone.png', // Dynamic rendering overrides this
    colors: {
      primary: '348, 89%, 63%',    // Rosa Coral: #f43f5e
      secondary: '174, 86%, 42%',  // Verde azulado: #0d9488
      accent: '271, 91%, 65%'      // Violeta: #a855f7
    },
    branches: [
      { name: 'PetCity La Reina', address: 'Av. Larraín 8700', delay: 'Listo en 15 min' },
      { name: 'PetCity Lo Barnechea', address: 'Av. El Rodeo 12800', delay: 'Listo en 30 min' },
      { name: 'PetCity Chicureo', address: 'Av. Chicureo 2300', delay: 'Listo en 1 hora' }
    ]
  }
};

export function getTenantConfig() {
  const params = new URLSearchParams(window.location.search);
  const tenantParam = params.get('tenant');
  
  if (tenantParam && TENANTS[tenantParam.toLowerCase()]) {
    return TENANTS[tenantParam.toLowerCase()];
  }
  
  // Hostname detection fallback (SaaS production style)
  const host = window.location.hostname;
  if (host.includes('superzoo')) {
    return TENANTS.superzoo;
  } else if (host.includes('petcity')) {
    return TENANTS.petcity;
  }
  
  return TENANTS.default;
}

export function applyTenantStyles(config) {
  const root = document.documentElement;
  
  if (config.colors) {
    const pColor = config.colors.primary;
    const sColor = config.colors.secondary;
    const aColor = config.colors.accent;
    
    root.style.setProperty('--primary', `hsl(${pColor})`);
    root.style.setProperty('--secondary', `hsl(${sColor})`);
    root.style.setProperty('--accent', `hsl(${aColor})`);
    
    // Calculate translucent HSL glows
    const pValues = pColor.split(',');
    const sValues = sColor.split(',');
    
    root.style.setProperty('--primary-glow', `hsla(${pValues[0]}, ${pValues[1]}, ${pValues[2]}, 0.15)`);
    root.style.setProperty('--secondary-glow', `hsla(${sValues[0]}, ${sValues[1]}, ${sValues[2]}, 0.15)`);
  }

  // Dynamic branding headers
  const headerLogo = document.querySelector('.header-bar img');
  if (headerLogo) {
    const existingTextLogo = document.getElementById('header-text-logo');
    if (existingTextLogo) existingTextLogo.remove();
    
    if (config.id === 'superzoo') {
      headerLogo.style.display = 'none';
      const textLogo = document.createElement('h1');
      textLogo.id = 'header-text-logo';
      textLogo.style.margin = '0';
      textLogo.style.fontSize = '1.2rem';
      textLogo.style.fontWeight = '900';
      textLogo.style.letterSpacing = '-0.5px';
      textLogo.style.color = 'var(--primary)';
      textLogo.innerHTML = '🧡 SuperZoo <span style="font-weight: 300; font-size: 0.75rem; color: var(--text-secondary);">Comunidad</span>';
      headerLogo.parentNode.appendChild(textLogo);
    } else if (config.id === 'petcity') {
      headerLogo.style.display = 'none';
      const textLogo = document.createElement('h1');
      textLogo.id = 'header-text-logo';
      textLogo.style.margin = '0';
      textLogo.style.fontSize = '1.2rem';
      textLogo.style.fontWeight = '900';
      textLogo.style.letterSpacing = '-0.5px';
      textLogo.style.color = 'var(--primary)';
      textLogo.innerHTML = '🏙️ PetCity <span style="font-weight: 300; font-size: 0.75rem; color: var(--text-secondary);">Comunidad</span>';
      headerLogo.parentNode.appendChild(textLogo);
    } else {
      headerLogo.style.display = 'block';
      headerLogo.src = config.logo;
    }
  }
}
