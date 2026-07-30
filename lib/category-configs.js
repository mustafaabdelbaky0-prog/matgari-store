// category-configs.js — per-category definitions that drive both the admin
// product form AND the public landing page. Adding a new category = adding a
// new entry here; both admin and store pick it up.
//
// Shape:
//   id          — matches merchants.category
//   label       — Arabic name for UI
//   emoji       — icon
//   attributes  — extra fields stored in products.attributes (JSONB)
//                   each: { key, label, type: 'text'|'multi'|'select', options?, placeholder? }
//   filterKey   — attributes key used for the store filter chips (or null)
//   theme       — colors, hero title/subtitle, logo emoji, tag line
//   sizeLabel   — heading text above the size selector on the store card
//
// Kids clothing stays on its dedicated Laila-style renderer (lib/kids-landing.js)
// so this file's rendering is only used for the other categories.

const CATEGORIES = {
  kids: {
    id: 'kids',
    label: 'ملابس أطفال',
    emoji: '🧒',
    attributes: [
      { key: 'sections', label: 'الأقسام', type: 'multi', options: ['أولادي', 'بناتي', 'أطقم'] },
      { key: 'sizes',    label: 'المقاسات', type: 'multi', options: ['2-3 سنين','4-5 سنين','6-7 سنين','8-9 سنين','10-11 سنين','12-13 سنين'] },
      { key: 'colors',   label: 'الألوان', type: 'multi', options: ['أحمر','وردي','أسود','تركواز','أبيض','أخضر','أزرق','أصفر','بنفسجي'] },
    ],
    filterKey: 'sections',
    stockKey: 'sizes',
    sizeLabel: 'اختاري المقاس',
    theme: {
      palette: { primary: '#B84A64', accent: '#D9647E', soft: '#F5CBD6', bg: '#FBF3EC' },
      hero: {
        title: 'أهلاً بيكي في {store_name}',
        subtitle: 'اختاري لطفلك من مجموعتنا، والدفع عند الاستلام لكل محافظات مصر',
        logo: '👶',
        tag: 'ملابس أطفال بحب 🎀',
      },
    },
  },

  perfumes: {
    id: 'perfumes',
    label: 'عطور',
    emoji: '🧴',
    attributes: [
      { key: 'gender',      label: 'النوع',    type: 'select', options: ['رجالي','حريمي','يونيسكس'] },
      { key: 'volumes',     label: 'الأحجام',  type: 'multi',  options: ['30 مل','50 مل','75 مل','100 مل','150 مل'] },
      { key: 'brand',       label: 'العلامة التجارية', type: 'text', placeholder: 'مثال: Dior' },
      { key: 'scent_family',label: 'العائلة العطرية',  type: 'select', options: ['زهري','خشبي','شرقي','حمضي','فواكه','عود','مسك'] },
    ],
    filterKey: 'gender',
    stockKey: 'volumes',
    sizeLabel: 'اختار الحجم',
    theme: {
      palette: { primary: '#5B3A29', accent: '#C8A97E', soft: '#F1E4D0', bg: '#F8F1E8' },
      hero: {
        title: 'رائحة تميزك في {store_name}',
        subtitle: 'أفخم العطور الأصلية بأفضل الأسعار — توصيل لكل المحافظات، الدفع عند الاستلام',
        logo: '🧴',
        tag: 'عطور فخمة تدوم',
      },
    },
  },

  shoes: {
    id: 'shoes',
    label: 'أحذية',
    emoji: '👟',
    attributes: [
      { key: 'gender',   label: 'النوع',      type: 'select', options: ['رجالي','حريمي','أطفال'] },
      { key: 'sizes',    label: 'المقاسات',   type: 'multi',  options: ['36','37','38','39','40','41','42','43','44','45','46'] },
      { key: 'colors',   label: 'الألوان',    type: 'multi',  options: ['أسود','أبيض','بني','بيج','رمادي','أحمر','أزرق','ذهبي','فضي'] },
      { key: 'material', label: 'الخامة',     type: 'select', options: ['جلد طبيعي','جلد صناعي','قماش','شمواة','مطاط'] },
      { key: 'style',    label: 'الطراز',     type: 'select', options: ['رياضي','كاجوال','كلاسيك','رسمي','صندل'] },
    ],
    filterKey: 'gender',
    stockKey: 'sizes',
    sizeLabel: 'اختار المقاس',
    theme: {
      palette: { primary: '#1F4E5F', accent: '#4A9BA8', soft: '#CDE7EC', bg: '#F0F6F8' },
      hero: {
        title: 'اختار حذاءك من {store_name}',
        subtitle: 'أحذية أصلية بجودة مضمونة — كل المقاسات متوفرة، الدفع عند الاستلام',
        logo: '👟',
        tag: 'كل خطوة بثقة',
      },
    },
  },

  'phone-accessories': {
    id: 'phone-accessories',
    label: 'إكسسوارات موبايل',
    emoji: '📱',
    attributes: [
      { key: 'compatibility', label: 'الأجهزة المتوافقة', type: 'text', placeholder: 'iPhone 15, Samsung S24, Xiaomi 14...' },
      { key: 'product_type',  label: 'نوع المنتج',       type: 'select', options: ['كفر','سكرين','شاحن','كابل','سماعة','باور بانك','حامل موبايل','آخر'] },
      { key: 'colors',        label: 'الألوان',          type: 'multi',  options: ['أسود','أبيض','شفاف','أزرق','وردي','أحمر','ذهبي'] },
      { key: 'material',      label: 'الخامة',           type: 'select', options: ['سيليكون','بلاستيك','معدن','جلد','زجاج مقوى'] },
    ],
    filterKey: 'product_type',
    sizeLabel: 'اختار الموديل',
    theme: {
      palette: { primary: '#1E293B', accent: '#3B82F6', soft: '#DBEAFE', bg: '#F1F5F9' },
      hero: {
        title: 'إكسسوارات موبايلك في {store_name}',
        subtitle: 'كفرات، شواحن، سماعات — أصلية وضمان، توصيل سريع لكل مصر',
        logo: '📱',
        tag: 'موبايلك يستاهل',
      },
    },
  },

  men: {
    id: 'men',
    label: 'ملابس شبابي',
    emoji: '👔',
    attributes: [
      { key: 'sections', label: 'القسم',    type: 'multi',  options: ['تيشرتات','قمصان','بناطيل','جاكيتات','شورت','بيجامات'] },
      { key: 'sizes',    label: 'المقاسات', type: 'multi',  options: ['S','M','L','XL','XXL','XXXL'] },
      { key: 'colors',   label: 'الألوان',  type: 'multi',  options: ['أسود','أبيض','رمادي','كحلي','أزرق','بني','بيج','أخضر زيتي','أحمر'] },
      { key: 'material', label: 'الخامة',   type: 'select', options: ['قطن','بوليستر','كتان','جينز','صوف'] },
      { key: 'fit',      label: 'التفصيل',  type: 'select', options: ['ريجيولار','سليم','أوفر سايز','لوز'] },
    ],
    filterKey: 'sections',
    stockKey: 'sizes',
    sizeLabel: 'اختار المقاس',
    theme: {
      palette: { primary: '#0F172A', accent: '#334155', soft: '#CBD5E1', bg: '#F8FAFC' },
      hero: {
        title: 'ستايلك يبدأ من {store_name}',
        subtitle: 'ملابس شبابي بخامات ممتازة وأسعار حقيقية — الدفع عند الاستلام',
        logo: '👔',
        tag: 'كن مختلفًا',
      },
    },
  },

  'women-accessories': {
    id: 'women-accessories',
    label: 'إكسسوارات حريمي',
    emoji: '💍',
    attributes: [
      { key: 'product_type', label: 'نوع الإكسسوار', type: 'select', options: ['خواتم','حلق','عقود','أساور','ساعات','دبل','طقم كامل','شنط'] },
      { key: 'material',     label: 'الخامة',        type: 'select', options: ['ذهب','فضة','فضة مطلية ذهب','ستانلس','نحاس','خرز','كريستال'] },
      { key: 'colors',       label: 'الألوان',       type: 'multi',  options: ['ذهبي','فضي','روز جولد','أسود','لؤلؤي','متعدد الألوان'] },
      { key: 'occasion',     label: 'المناسبة',      type: 'select', options: ['يومي','خطوبة','فرح','سواريه','هدية'] },
    ],
    filterKey: 'product_type',
    sizeLabel: 'اختاري النوع',
    theme: {
      palette: { primary: '#8B4A6B', accent: '#D4A574', soft: '#F5E6D3', bg: '#FAF3EA' },
      hero: {
        title: 'اكتشفي جمالك مع {store_name}',
        subtitle: 'إكسسوارات فخمة تناسب كل إطلالة — توصيل وتغليف هدية مجاني',
        logo: '💍',
        tag: 'أنيقة في كل التفاصيل',
      },
    },
  },

  home: {
    id: 'home',
    label: 'أدوات منزلية',
    emoji: '🏠',
    attributes: [
      { key: 'category',    label: 'الفئة',    type: 'select', options: ['أدوات مطبخ','ديكور','تنظيم','منسوجات','إلكترونيات منزلية','حمام','مفروشات'] },
      { key: 'material',    label: 'الخامة',   type: 'select', options: ['ستانلس','خشب','بلاستيك','سيراميك','زجاج','قماش','معدن'] },
      { key: 'colors',      label: 'الألوان',  type: 'multi',  options: ['أبيض','أسود','فضي','ذهبي','خشبي','بني','رمادي','متعدد'] },
      { key: 'dimensions',  label: 'المقاسات', type: 'text',   placeholder: 'مثال: 30x40 سم، أو حجم 5 لتر' },
    ],
    filterKey: 'category',
    sizeLabel: 'المواصفات',
    theme: {
      palette: { primary: '#2C5F5D', accent: '#5FA69E', soft: '#D4EAE7', bg: '#F0F6F5' },
      hero: {
        title: 'بيتك أجمل مع {store_name}',
        subtitle: 'كل احتياجات البيت في مكان واحد — جودة عالية وأسعار مناسبة',
        logo: '🏠',
        tag: 'راحتك في تفاصيل بيتك',
      },
    },
  },

  packaging: {
    id: 'packaging',
    label: 'مواد تعبئة وتغليف',
    emoji: '📦',
    attributes: [
      { key: 'product_type', label: 'النوع',          type: 'select', options: ['علب كرتون','أكياس بلاستيك','ورق تغليف','شرائط','ملصقات','بابل راب','فوم','صناديق خشب'] },
      { key: 'dimensions',   label: 'المقاسات',        type: 'text',   placeholder: 'مثال: 20x15x10 سم' },
      { key: 'pack_size',    label: 'عدد القطع في الباكيت', type: 'text', placeholder: 'مثال: 100 قطعة' },
      { key: 'colors',       label: 'الألوان المتاحة', type: 'multi',  options: ['بني','أبيض','أسود','ذهبي','فضي','شفاف','ملوّن'] },
    ],
    filterKey: 'product_type',
    sizeLabel: 'المقاس',
    theme: {
      palette: { primary: '#78350F', accent: '#B8894C', soft: '#F5E6D3', bg: '#F9F5EF' },
      hero: {
        title: 'حلول التغليف من {store_name}',
        subtitle: 'كرتون، أكياس، شرائط — بالجملة وبأسعار المصنع، توصيل لكل مصر',
        logo: '📦',
        tag: 'التغليف اللي بيميّز بيزنسك',
      },
    },
  },
};

function getCategoryConfig(id) {
  return CATEGORIES[id] || null;
}

function listCategories() {
  return Object.values(CATEGORIES).map((c) => ({ id: c.id, label: c.label, emoji: c.emoji }));
}

module.exports = { CATEGORIES, getCategoryConfig, listCategories };
