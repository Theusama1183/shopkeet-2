import { Config } from "@puckeditor/core";
import type { CustomField } from "@puckeditor/core";
import {
  ShoppingCart, Star, ChevronLeft, ChevronRight, ArrowRight,
  Play, Package, Tag, Heart, Eye,
  Instagram, Twitter, Facebook, Youtube, Mail, Phone, MapPin,
  AlignLeft, AlignCenter, AlignRight,
  Image as ImageIcon, Video as VideoIcon,
  Maximize2, Layers, Palette, Type,
} from "lucide-react";
import {
  fileUploaderField,
  iconRadioField,
  searchableSelectField,
  toggleButtonField,
  colorPickerField,
  sliderField,
  buttonGroupField,
} from "@/lib/puck/fields";


// Cast helper — Puck's Config<Props> enforces strict literal types per field,
// but our reusable custom fields are typed as CustomField<string|boolean|number>.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const f = <T,>(field: CustomField<T>) => field as any;


// Helper Components
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i <= rating ? "fill-amber-400 text-amber-400" : "text-zinc-200"}`}
        />
      ))}
    </div>
  );
}

function MockProductCard({
  index,
  cardStyle,
  showPrice,
  showBadge,
  badgeText,
  showAddToCart,
}: {
  index: number;
  cardStyle: string;
  showPrice: boolean;
  showBadge: boolean;
  badgeText: string;
  showAddToCart: boolean;
}) {
  const names = ["Classic White Tee", "Leather Wallet", "Wireless Earbuds", "Canvas Backpack", "Silk Scarf", "Running Shoes", "Ceramic Mug", "Sunglasses"];
  const prices = [29.99, 49.99, 89.99, 69.99, 39.99, 119.99, 24.99, 59.99];
  const name = names[index % names.length];
  const price = prices[index % prices.length];

  const cardClasses: Record<string, string> = {
    default: "bg-white rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-300",
    minimal: "bg-transparent group",
    bordered: "bg-white rounded-2xl overflow-hidden border border-zinc-200 group hover:border-violet-300 transition-all duration-300",
    shadow: "bg-white rounded-2xl overflow-hidden shadow-md group hover:shadow-xl transition-all duration-300",
  };

  return (
    <div className={cardClasses[cardStyle] || cardClasses.default}>
      <div className="relative aspect-square bg-linear-to-br from-zinc-100 to-zinc-200 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <Package className="w-12 h-12 text-zinc-300" />
        </div>
        {showBadge && badgeText && (
          <span className="absolute top-3 left-3 bg-violet-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            {badgeText}
          </span>
        )}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-violet-50 transition-colors">
            <Heart className="w-4 h-4 text-zinc-500" />
          </button>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-zinc-900 text-sm mb-1 truncate">{name}</h3>
        <div className="flex items-center gap-1 mb-2">
          <StarRating rating={4} />
          <span className="text-xs text-zinc-400">(24)</span>
        </div>
        {showPrice && (
          <div className="flex items-center justify-between">
            <span className="font-bold text-zinc-900">${price.toFixed(2)}</span>
            {showAddToCart && (
              <button className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                <ShoppingCart className="w-3.5 h-3.5" />
                Add
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const config: Config<any> = {
  components: {

    // Announcement Bar
    AnnouncementBar: {
      fields: {
        text: { type: "text", label: "Message" },
        link: { type: "text", label: "Link URL" },
        linkText: { type: "text", label: "Link Text" },
        bgColor: f(colorPickerField({ label: "Background Color", icon: <Palette size={14} /> })),
        textColor: f(colorPickerField({ label: "Text Color", icon: <Palette size={14} /> })),
        dismissible: f(toggleButtonField({ label: "Dismissible", onLabel: "Yes", offLabel: "No" })),
      },
      defaultProps: {
        text: "🎉 Free shipping on orders over $50!",
        link: "",
        linkText: "Shop Now",
        bgColor: "#7c3aed",
        textColor: "#ffffff",
        dismissible: true,
      },
      render: ({ text, link, linkText, bgColor, textColor }) => (
        <div
          className="w-full py-2.5 px-4 text-center text-sm font-medium flex items-center justify-center gap-3"
          style={{ backgroundColor: bgColor, color: textColor }}
        >
          <span>{text}</span>
          {link && linkText && (
            <a href={link} className="underline font-bold hover:opacity-80 transition-opacity">
              {linkText} →
            </a>
          )}
        </div>
      ),
    },

    // Hero Section
    HeroSection: {
      fields: {
        title: { type: "text", label: "Headline" },
        subtitle: { type: "textarea", label: "Subheadline" },
        backgroundType: f(buttonGroupField({
          label: "Background Type",
          options: [
            { value: "gradient", label: "Gradient", icon: <Layers size={13} /> },
            { value: "image",    label: "Image",    icon: <ImageIcon size={13} /> },
            { value: "color",    label: "Color",    icon: <Palette size={13} /> },
          ],
        })),
        backgroundImage: f(fileUploaderField({ label: "Background Image", accept: "image/*", icon: <ImageIcon size={14} /> })),
        gradientFrom: f(colorPickerField({ label: "Gradient From", icon: <Palette size={14} /> })),
        gradientTo:   f(colorPickerField({ label: "Gradient To",   icon: <Palette size={14} /> })),
        bgColor:      f(colorPickerField({ label: "Background Color", icon: <Palette size={14} /> })),
        overlayOpacity: f(sliderField({ label: "Overlay Opacity", min: 0, max: 100, unit: "%" })),
        textAlign: f(iconRadioField({
          label: "Text Alignment",
          options: [
            { value: "left",   icon: <AlignLeft size={14} />,   label: "Left" },
            { value: "center", icon: <AlignCenter size={14} />, label: "Center" },
            { value: "right",  icon: <AlignRight size={14} />,  label: "Right" },
          ],
        })),
        minHeight: f(searchableSelectField({
          label: "Height",
          icon: <Maximize2 size={14} />,
          options: [
            { value: "sm",   label: "Small (400px)" },
            { value: "md",   label: "Medium (550px)" },
            { value: "lg",   label: "Large (700px)" },
            { value: "full", label: "Full Screen" },
          ],
        })),
        ctaText:           { type: "text", label: "Primary Button Text" },
        ctaLink:           { type: "text", label: "Primary Button Link" },
        ctaVariant: f(buttonGroupField({
          label: "Primary Button Style",
          options: [
            { value: "default", label: "Default" },
            { value: "outline", label: "Outline" },
            { value: "white",   label: "White" },
          ],
        })),
        secondaryCtaText: { type: "text", label: "Secondary Button Text" },
        secondaryCtaLink: { type: "text", label: "Secondary Button Link" },
        textColor: f(colorPickerField({ label: "Text Color", icon: <Palette size={14} /> })),
      },
      defaultProps: {
        title: "Welcome to Our Store",
        subtitle: "Discover amazing products at unbeatable prices. Shop the latest trends.",
        backgroundType: "gradient",
        backgroundImage: "",
        gradientFrom: "#7c3aed",
        gradientTo: "#4f46e5",
        bgColor: "#7c3aed",
        overlayOpacity: 40,
        textAlign: "center",
        minHeight: "lg",
        ctaText: "Shop Now",
        ctaLink: "/products",
        ctaVariant: "white",
        secondaryCtaText: "Learn More",
        secondaryCtaLink: "/about",
        textColor: "",
      },
      render: ({ title, subtitle, backgroundType, backgroundImage, gradientFrom, gradientTo, bgColor, overlayOpacity, textAlign, minHeight, ctaText, ctaLink, ctaVariant, secondaryCtaText, secondaryCtaLink, textColor }) => {
        const heights: Record<string, string> = { sm: "min-h-[400px]", md: "min-h-[550px]", lg: "min-h-[700px]", full: "min-h-screen" };
        const aligns: Record<string, string> = { left: "items-start text-left", center: "items-center text-center", right: "items-end text-right" };

        // For gradient/color backgrounds use inline style; for image use an <img> tag
        // so the browser can discover and prioritize it as the LCP element.
        let bgStyle: React.CSSProperties = {};
        if (backgroundType === "gradient") {
          bgStyle = { background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)` };
        } else if (backgroundType === "color") {
          bgStyle = { backgroundColor: bgColor };
        }

        const ctaBtnClass: Record<string, string> = {
          default: "bg-violet-600 hover:bg-violet-700 text-white",
          outline: "border-2 border-white text-white hover:bg-white hover:text-zinc-900",
          white: "bg-white text-zinc-900 hover:bg-zinc-100",
        };

        return (
          <div
            className={`relative flex flex-col justify-center ${heights[minHeight]} px-6 py-16 overflow-hidden`}
            style={bgStyle}
          >
            {/* Use <img> instead of CSS background-image so the browser can
                discover and fetch it early as the LCP resource */}
            {backgroundType === "image" && backgroundImage && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={backgroundImage}
                  alt=""
                  aria-hidden="true"
                  fetchPriority="high"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black" style={{ opacity: overlayOpacity / 100 }} />
              </>
            )}
            <div className={`relative z-10 max-w-5xl mx-auto w-full flex flex-col gap-6 ${aligns[textAlign]}`}>
              <h1
                className="text-5xl md:text-7xl font-heading font-bold leading-none tracking-tight"
                style={{ color: textColor || "white" }}
              >
                {title}
              </h1>
              <p
                className="text-lg md:text-xl max-w-2xl leading-relaxed opacity-90"
                style={{ color: textColor || "white" }}
              >
                {subtitle}
              </p>
              <div className={`flex flex-wrap gap-4 ${textAlign === "center" ? "justify-center" : textAlign === "right" ? "justify-end" : "justify-start"}`}>
                {ctaText && (
                  <a
                    href={ctaLink || "#"}
                    className={`inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-base transition-all shadow-lg ${ctaBtnClass[ctaVariant]}`}
                  >
                    {ctaText}
                    <ArrowRight className="w-4 h-4" />
                  </a>
                )}
                {secondaryCtaText && (
                  <a
                    href={secondaryCtaLink || "#"}
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-base border-2 border-white/40 text-white hover:border-white/80 transition-all"
                  >
                    {secondaryCtaText}
                  </a>
                )}
              </div>
            </div>
          </div>
        );
      },
    },

    // Social Proof Bar
    SocialProofBar: {
      fields: {
        stats: {
          type: "array", label: "Stats",
          getItemSummary: (item) => item.value || "Stat",
          arrayFields: {
            value: { type: "text", label: "Value (e.g. 10K+)" },
            label: { type: "text", label: "Label (e.g. Happy Customers)" },
          },
        },
        bgColor:   f(colorPickerField({ label: "Background Color", icon: <Palette size={14} /> })),
        textColor: f(colorPickerField({ label: "Text Color",       icon: <Palette size={14} /> })),
      },
      defaultProps: {
        stats: [
          { value: "10K+", label: "Happy Customers" },
          { value: "500+", label: "Products" },
          { value: "99%", label: "Satisfaction" },
          { value: "24/7", label: "Support" },
        ],
        bgColor: "#18181b",
        textColor: "#ffffff",
      },
      render: ({ stats, bgColor, textColor }) => (
        <div className="py-10 px-6" style={{ backgroundColor: bgColor }}>
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s: { value: string; label: string }, i: number) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-heading font-bold" style={{ color: textColor }}>{s.value}</div>
                <div className="text-sm mt-1 opacity-70" style={{ color: textColor }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    // Heading Block
    HeadingBlock: {
      fields: {
        text: { type: "text", label: "Heading Text" },
        level: f(searchableSelectField({
          label: "Heading Level",
          icon: <Type size={14} />,
          options: [
            { value: "h1", label: "H1 — Page Title" },
            { value: "h2", label: "H2 — Section Title" },
            { value: "h3", label: "H3 — Subsection" },
            { value: "h4", label: "H4" },
            { value: "h5", label: "H5" },
            { value: "h6", label: "H6" },
          ],
        })),
        size: f(searchableSelectField({
          label: "Font Size",
          options: [
            { value: "xs",  label: "XS" }, { value: "sm",  label: "SM" },
            { value: "base",label: "Base"},{ value: "lg",  label: "LG" },
            { value: "xl",  label: "XL" }, { value: "2xl", label: "2XL" },
            { value: "3xl", label: "3XL" },{ value: "4xl", label: "4XL" },
            { value: "5xl", label: "5XL" },
          ],
        })),
        align: f(iconRadioField({
          label: "Alignment",
          options: [
            { value: "left",   icon: <AlignLeft size={14} />,   label: "Left" },
            { value: "center", icon: <AlignCenter size={14} />, label: "Center" },
            { value: "right",  icon: <AlignRight size={14} />,  label: "Right" },
          ],
        })),
        color: f(colorPickerField({ label: "Color", icon: <Palette size={14} /> })),
      },
      defaultProps: { text: "Section Heading", level: "h2", size: "3xl", align: "center", color: "" },
      render: ({ text, level, size, align, color }) => {
        const Tag = level as keyof React.JSX.IntrinsicElements;
        const sizeMap: Record<string, string> = {
          xs: "text-xs", sm: "text-sm", base: "text-base", lg: "text-lg",
          xl: "text-xl", "2xl": "text-2xl", "3xl": "text-3xl", "4xl": "text-4xl", "5xl": "text-5xl",
        };
        const alignMap: Record<string, string> = { left: "text-left", center: "text-center", right: "text-right" };
        return (
          <Tag
            className={`font-heading font-bold leading-tight ${sizeMap[size]} ${alignMap[align]} py-2`}
            style={color ? { color } : {}}
          >
            {text}
          </Tag>
        );
      },
    },

    // Rich Text Block
    RichTextBlock: {
      fields: {
        content: { type: "textarea", label: "Content" },
        align: f(iconRadioField({
          label: "Alignment",
          options: [
            { value: "left",   icon: <AlignLeft size={14} />,   label: "Left" },
            { value: "center", icon: <AlignCenter size={14} />, label: "Center" },
            { value: "right",  icon: <AlignRight size={14} />,  label: "Right" },
          ],
        })),
        maxWidth: f(buttonGroupField({
          label: "Max Width",
          options: [
            { value: "narrow", label: "Narrow" },
            { value: "medium", label: "Medium" },
            { value: "wide",   label: "Wide" },
            { value: "full",   label: "Full" },
          ],
        })),
      },
      defaultProps: { content: "Add your text content here. This block supports multiple paragraphs.", align: "left", maxWidth: "medium" },
      render: ({ content, align, maxWidth }) => {
        const widthMap: Record<string, string> = { narrow: "max-w-[600px]", medium: "max-w-[800px]", wide: "max-w-[1000px]", full: "max-w-full" };
        const alignMap: Record<string, string> = { left: "text-left", center: "text-center mx-auto", right: "text-right ml-auto" };
        return (
          <div className={`py-4 px-6 ${widthMap[maxWidth]} ${alignMap[align]}`}>
            {content.split("\n").map((para: string, i: number) => (
              <p key={i} className="text-zinc-600 leading-relaxed mb-4 last:mb-0">{para}</p>
            ))}
          </div>
        );
      },
    },

    // Button Block
    ButtonBlock: {
      fields: {
        text: { type: "text", label: "Button Text" },
        href: { type: "text", label: "Link URL" },
        variant: f(buttonGroupField({
          label: "Style",
          options: [
            { value: "primary", label: "Primary" },
            { value: "outline", label: "Outline" },
            { value: "ghost",   label: "Ghost" },
            { value: "white",   label: "White" },
          ],
        })),
        size: f(buttonGroupField({
          label: "Size",
          options: [
            { value: "sm", label: "SM" },
            { value: "md", label: "MD" },
            { value: "lg", label: "LG" },
          ],
        })),
        align: f(iconRadioField({
          label: "Alignment",
          options: [
            { value: "left",   icon: <AlignLeft size={14} />,   label: "Left" },
            { value: "center", icon: <AlignCenter size={14} />, label: "Center" },
            { value: "right",  icon: <AlignRight size={14} />,  label: "Right" },
          ],
        })),
        icon: f(searchableSelectField({
          label: "Icon",
          options: [
            { value: "none",  label: "None" },
            { value: "arrow", label: "Arrow →" },
            { value: "cart",  label: "Cart 🛒" },
            { value: "heart", label: "Heart ♥" },
          ],
        })),
        selectorID: { type: "text", label: "ID" },
        fullWidth: f(toggleButtonField({ label: "Full Width", onLabel: "Yes", offLabel: "No" })),
      },
      defaultProps: { text: "Shop Now", href: "#", variant: "primary", size: "md", align: "center", icon: "arrow", fullWidth: false },
      render: ({ text, href, variant, size, align, icon, fullWidth, selectorID }) => {
        const variantClass: Record<string, string> = {
          primary: "bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-200",
          outline: "border-2 border-zinc-900 text-zinc-900 hover:bg-zinc-900 hover:text-white",
          ghost: "text-violet-600 hover:bg-violet-50",
          white: "bg-white text-zinc-900 hover:bg-zinc-100 shadow-md",
        };
        const sizeClass: Record<string, string> = {
          sm: "px-4 py-2 text-sm rounded-lg",
          md: "px-6 py-3 text-base rounded-xl",
          lg: "px-8 py-4 text-lg rounded-xl",
        };
        const alignClass: Record<string, string> = { left: "justify-start", center: "justify-center", right: "justify-end" };
        const IconComp = icon === "arrow" ? ArrowRight : icon === "cart" ? ShoppingCart : icon === "heart" ? Heart : null;
        return (
          <div className={`flex py-3 px-6 ${alignClass[align]}`}>
            <a
              id={selectorID}
              href={href || "#"}
              className={`inline-flex items-center gap-2 font-semibold transition-all  ${variantClass[variant]} ${sizeClass[size]} ${fullWidth ? "w-full justify-center" : ""}`}
            >
              {text}
              {IconComp && <IconComp className="w-4 h-4" />}
            </a>
          </div>
        );
      },
    },

    // Image Block
    ImageBlock: {
      fields: {
        src: f(fileUploaderField({ label: "Image", accept: "image/*", icon: <ImageIcon size={14} /> })),
        alt: { type: "text", label: "Alt Text (SEO)" },
        caption: { type: "text", label: "Caption" },
        rounded: f(buttonGroupField({
          label: "Border Radius",
          options: [
            { value: "none", label: "None" },
            { value: "sm",   label: "SM" },
            { value: "md",   label: "MD" },
            { value: "lg",   label: "LG" },
            { value: "full", label: "Full" },
          ],
        })),
        shadow: f(toggleButtonField({ label: "Drop Shadow", onLabel: "On", offLabel: "Off" })),
        aspectRatio: f(buttonGroupField({
          label: "Aspect Ratio",
          options: [
            { value: "auto",     label: "Auto" },
            { value: "square",   label: "1:1" },
            { value: "video",    label: "16:9" },
            { value: "portrait", label: "3:4" },
          ],
        })),
        align: f(iconRadioField({
          label: "Alignment",
          options: [
            { value: "left",   icon: <AlignLeft size={14} />,   label: "Left" },
            { value: "center", icon: <AlignCenter size={14} />, label: "Center" },
            { value: "right",  icon: <AlignRight size={14} />,  label: "Right" },
          ],
        })),
      },
      defaultProps: { src: "", alt: "Image", caption: "", rounded: "lg", shadow: true, aspectRatio: "auto", align: "center" },
      render: ({ src, alt, caption, rounded, shadow, aspectRatio, align }) => {
        const roundedMap: Record<string, string> = { none: "", sm: "rounded-sm", md: "rounded-md", lg: "rounded-2xl", full: "rounded-full" };
        const aspectMap: Record<string, string> = { auto: "", square: "aspect-square", video: "aspect-video", portrait: "aspect-[3/4]" };
        const alignMap: Record<string, string> = { left: "mr-auto", center: "mx-auto", right: "ml-auto" };
        return (
          <div className={`py-4 px-6 ${alignMap[align]} max-w-full`}>
            {src ? (
              <div className={`overflow-hidden ${roundedMap[rounded]} ${shadow ? "shadow-xl" : ""} ${aspectMap[aspectRatio]}`}>
                <img src={src} alt={alt} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className={`bg-zinc-100 flex items-center justify-center ${roundedMap[rounded]} ${aspectMap[aspectRatio] || "h-48"}`}>
                <div className="text-center text-zinc-400">
                  <Package className="w-10 h-10 mx-auto mb-2" />
                  <p className="text-sm">Add an image URL above</p>
                </div>
              </div>
            )}
            {caption && <p className="text-sm text-zinc-500 text-center mt-2">{caption}</p>}
          </div>
        );
      },
    },

    // Video Block
    VideoBlock: {
      fields: {
        src: f(fileUploaderField({ label: "Video File", accept: "video/*", icon: <VideoIcon size={14} /> })),
        poster: f(fileUploaderField({ label: "Poster Image", accept: "image/*", icon: <ImageIcon size={14} /> })),
        autoplay:    f(toggleButtonField({ label: "Autoplay",      onLabel: "On", offLabel: "Off" })),
        loop:        f(toggleButtonField({ label: "Loop",          onLabel: "On", offLabel: "Off" })),
        muted:       f(toggleButtonField({ label: "Muted",         onLabel: "On", offLabel: "Off" })),
        controls:    f(toggleButtonField({ label: "Show Controls", onLabel: "On", offLabel: "Off" })),
        aspectRatio: f(buttonGroupField({
          label: "Aspect Ratio",
          options: [
            { value: "video",  label: "16:9" },
            { value: "square", label: "1:1" },
          ],
        })),
        rounded: f(buttonGroupField({
          label: "Border Radius",
          options: [
            { value: "none", label: "None" },
            { value: "sm",   label: "SM" },
            { value: "md",   label: "MD" },
            { value: "lg",   label: "LG" },
          ],
        })),
      },
      defaultProps: { src: "", poster: "", autoplay: false, loop: false, muted: true, controls: true, aspectRatio: "video", rounded: "lg" },
      render: ({ src, poster, autoplay, loop, muted, controls, aspectRatio, rounded }) => {
        const roundedMap: Record<string, string> = { none: "", sm: "rounded-sm", md: "rounded-md", lg: "rounded-2xl" };
        const aspectMap: Record<string, string> = { video: "aspect-video", square: "aspect-square" };
        return (
          <div className="py-4 px-6">
            <div className={`overflow-hidden shadow-xl ${roundedMap[rounded]} ${aspectMap[aspectRatio]}`}>
              {src ? (
                <video
                  src={src}
                  poster={poster || undefined}
                  autoPlay={autoplay}
                  loop={loop}
                  muted={muted}
                  controls={controls}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                  <div className="text-center text-zinc-400">
                    <Play className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm">Add a video URL above</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      },
    },

    // Divider Block
    DividerBlock: {
      fields: {
        style: {
          type: "select", label: "Style",
          options: [
            { label: "Solid", value: "solid" }, { label: "Dashed", value: "dashed" },
            { label: "Dotted", value: "dotted" }, { label: "Gradient", value: "gradient" },
          ],
        },
        color: { type: "text", label: "Color (hex)" },
        thickness: { type: "number", label: "Thickness (px)" },
        spacing: {
          type: "select", label: "Vertical Spacing",
          options: [{ label: "Small", value: "sm" }, { label: "Medium", value: "md" }, { label: "Large", value: "lg" }, { label: "XL", value: "xl" }],
        },
      },
      defaultProps: { style: "solid", color: "#e4e4e7", thickness: 1, spacing: "md" },
      render: ({ style, color, thickness, spacing }) => {
        const spacingMap: Record<string, string> = { sm: "my-4", md: "my-8", lg: "my-12", xl: "my-16" };
        const borderStyle = style === "gradient"
          ? { background: `linear-gradient(90deg, transparent, ${color}, transparent)`, height: `${thickness}px`, border: "none" }
          : { borderTopStyle: style as "solid" | "dashed" | "dotted", borderTopWidth: `${thickness}px`, borderTopColor: color };
        return <div className={`mx-6 ${spacingMap[spacing]}`} style={borderStyle} />;
      },
    },

    // Spacer Block
    SpacerBlock: {
      fields: {
        height: {
          type: "select", label: "Height",
          options: [
            { label: "XS (8px)", value: "xs" }, { label: "SM (16px)", value: "sm" },
            { label: "MD (32px)", value: "md" }, { label: "LG (64px)", value: "lg" },
            { label: "XL (96px)", value: "xl" }, { label: "2XL (128px)", value: "2xl" },
          ],
        },
      },
      defaultProps: { height: "md" },
      render: ({ height }) => {
        const heightMap: Record<string, string> = { xs: "h-2", sm: "h-4", md: "h-8", lg: "h-16", xl: "h-24", "2xl": "h-32" };
        return <div className={heightMap[height]} />;
      },
    },
    // Product Grid
    ProductGrid: {
      fields: {
        title: { type: "text", label: "Section Title" },
        subtitle: { type: "text", label: "Section Subtitle" },
        columns: f(buttonGroupField({
          label: "Columns",
          options: [
            { value: "2", label: "2" },
            { value: "3", label: "3" },
            { value: "4", label: "4" },
          ],
        })),
        gap: f(buttonGroupField({
          label: "Gap",
          options: [
            { value: "sm", label: "SM" },
            { value: "md", label: "MD" },
            { value: "lg", label: "LG" },
          ],
        })),
        cardStyle: f(searchableSelectField({
          label: "Card Style",
          options: [
            { value: "default",  label: "Default" },
            { value: "minimal",  label: "Minimal" },
            { value: "bordered", label: "Bordered" },
            { value: "shadow",   label: "Shadow" },
          ],
        })),
        showPrice:    f(toggleButtonField({ label: "Show Price",       onLabel: "Yes", offLabel: "No" })),
        showBadge:    f(toggleButtonField({ label: "Show Badge",       onLabel: "Yes", offLabel: "No" })),
        badgeText:    { type: "text", label: "Badge Text (e.g. New, Sale)" },
        showAddToCart:f(toggleButtonField({ label: "Show Add to Cart", onLabel: "Yes", offLabel: "No" })),
        limit:        f(sliderField({ label: "Max Products", min: 1, max: 12 })),
      },
      defaultProps: {
        title: "Featured Products",
        subtitle: "Handpicked just for you",
        columns: 3,
        gap: "md",
        cardStyle: "default",
        showPrice: true,
        showBadge: true,
        badgeText: "New",
        showAddToCart: true,
        limit: 6,
      },
      render: ({ title, subtitle, columns, gap, cardStyle, showPrice, showBadge, badgeText, showAddToCart, limit }) => {
        const colMap: Record<number, string> = {
          2: "grid-cols-1 sm:grid-cols-2",
          3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
          4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
        };
        const gapMap: Record<string, string> = { sm: "gap-3", md: "gap-6", lg: "gap-8" };
        return (
          <div className="py-12 px-6">
            {(title || subtitle) && (
              <div className="text-center mb-10">
                {title && <h2 className="text-3xl font-heading font-bold text-zinc-900 mb-2">{title}</h2>}
                {subtitle && <p className="text-zinc-500">{subtitle}</p>}
              </div>
            )}
            <div className={`grid ${colMap[columns]} ${gapMap[gap]} max-w-7xl mx-auto`}>
              {Array.from({ length: Math.min(limit, 8) }).map((_, i) => (
                <MockProductCard
                  key={i}
                  index={i}
                  cardStyle={cardStyle}
                  showPrice={showPrice}
                  showBadge={showBadge}
                  badgeText={badgeText}
                  showAddToCart={showAddToCart}
                />
              ))}
            </div>
          </div>
        );
      },
    },

    // Product Carousel
    ProductCarousel: {
      fields: {
        title: { type: "text", label: "Section Title" },
        subtitle: { type: "text", label: "Section Subtitle" },
        slidesVisible: f(buttonGroupField({
          label: "Slides Visible",
          options: [
            { value: "2", label: "2" },
            { value: "3", label: "3" },
            { value: "4", label: "4" },
          ],
        })),
        cardStyle: f(searchableSelectField({
          label: "Card Style",
          options: [
            { value: "default",  label: "Default" },
            { value: "minimal",  label: "Minimal" },
            { value: "bordered", label: "Bordered" },
          ],
        })),
        showPrice:     f(toggleButtonField({ label: "Show Price",       onLabel: "Yes", offLabel: "No" })),
        showAddToCart: f(toggleButtonField({ label: "Show Add to Cart", onLabel: "Yes", offLabel: "No" })),
        showArrows:    f(toggleButtonField({ label: "Show Arrows",      onLabel: "Yes", offLabel: "No" })),
        showDots:      f(toggleButtonField({ label: "Show Dots",        onLabel: "Yes", offLabel: "No" })),
        autoplay:      f(toggleButtonField({ label: "Autoplay",         onLabel: "On",  offLabel: "Off" })),
        autoplaySpeed: f(sliderField({ label: "Autoplay Speed (ms)", min: 1000, max: 8000, step: 500 })),
      },
      defaultProps: {
        title: "New Arrivals",
        subtitle: "Fresh styles just dropped",
        slidesVisible: 3,
        cardStyle: "default",
        showPrice: true,
        showAddToCart: true,
        showArrows: true,
        showDots: true,
        autoplay: false,
        autoplaySpeed: 3000,
      },
      render: ({ title, subtitle, slidesVisible, cardStyle, showPrice, showAddToCart, showArrows, showDots }) => {
        const colMap: Record<number, string> = {
          2: "grid-cols-2",
          3: "grid-cols-3",
          4: "grid-cols-4",
        };
        return (
          <div className="py-12 px-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-end justify-between mb-8">
                <div>
                  {title && <h2 className="text-3xl font-heading font-bold text-zinc-900">{title}</h2>}
                  {subtitle && <p className="text-zinc-500 mt-1">{subtitle}</p>}
                </div>
                {showArrows && (
                  <div className="flex gap-2">
                    <button className="w-10 h-10 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-zinc-50 transition-colors">
                      <ChevronLeft className="w-5 h-5 text-zinc-600" />
                    </button>
                    <button className="w-10 h-10 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-zinc-50 transition-colors">
                      <ChevronRight className="w-5 h-5 text-zinc-600" />
                    </button>
                  </div>
                )}
              </div>
              <div className={`grid ${colMap[slidesVisible]} gap-6`}>
                {Array.from({ length: slidesVisible + 1 }).map((_, i) => (
                  <MockProductCard
                    key={i}
                    index={i}
                    cardStyle={cardStyle}
                    showPrice={showPrice}
                    showBadge={false}
                    badgeText=""
                    showAddToCart={showAddToCart}
                  />
                ))}
              </div>
              {showDots && (
                <div className="flex justify-center gap-2 mt-6">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === 0 ? "bg-violet-600 w-6" : "bg-zinc-300"}`} />
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      },
    },

    // Product Card
    ProductCard: {
      fields: {
        productId: { type: "text", label: "Product ID (from your store)" },
        showDescription: { type: "radio", label: "Show Description", options: [{ label: "Yes", value: true }, { label: "No", value: false }] },
        showBadge: { type: "radio", label: "Show Badge", options: [{ label: "Yes", value: true }, { label: "No", value: false }] },
        badgeText: { type: "text", label: "Badge Text" },
        badgeColor: { type: "text", label: "Badge Color (hex)" },
        showAddToCart: { type: "radio", label: "Show Add to Cart", options: [{ label: "Yes", value: true }, { label: "No", value: false }] },
        cardStyle: {
          type: "select", label: "Card Style",
          options: [{ label: "Default", value: "default" }, { label: "Minimal", value: "minimal" }, { label: "Bordered", value: "bordered" }],
        },
      },
      defaultProps: {
        productId: "",
        showDescription: true,
        showBadge: true,
        badgeText: "Featured",
        badgeColor: "#7c3aed",
        showAddToCart: true,
        cardStyle: "default",
      },
      render: ({ showBadge, badgeText, showAddToCart, cardStyle }) => (
        <div className="py-4 px-6 max-w-sm mx-auto">
          <MockProductCard
            index={0}
            cardStyle={cardStyle}
            showPrice={true}
            showBadge={showBadge}
            badgeText={badgeText}
            showAddToCart={showAddToCart}
          />
        </div>
      ),
    },

    // Feature Section
    FeatureSection: {
      fields: {
        title: { type: "text", label: "Section Title" },
        subtitle: { type: "text", label: "Section Subtitle" },
        columns: {
          type: "select", label: "Columns",
          options: [{ label: "2 Columns", value: 2 }, { label: "3 Columns", value: 3 }, { label: "4 Columns", value: 4 }],
        },
        layout: {
          type: "select", label: "Layout Style",
          options: [
            { label: "Icon Top", value: "icon-top" },
            { label: "Icon Left", value: "icon-left" },
            { label: "Card Style", value: "card" },
          ],
        },
        features: {
          type: "array", label: "Features",
          getItemSummary: (item) => item.title || "Feature",
          arrayFields: {
            icon: { type: "text", label: "Icon (emoji or text)" },
            title: { type: "text", label: "Feature Title" },
            description: { type: "textarea", label: "Feature Description" },
            color: { type: "text", label: "Icon Color (hex)" },
          },
        },
        bgColor: { type: "text", label: "Background Color (hex, leave blank for transparent)" },
      },
      defaultProps: {
        title: "Why Choose Us",
        subtitle: "Everything you need, nothing you don't",
        columns: 3,
        layout: "icon-top",
        features: [
          { icon: "🚚", title: "Free Shipping", description: "Free shipping on all orders over $50.", color: "#7c3aed" },
          { icon: "🔒", title: "Secure Payments", description: "Your payment info is always safe.", color: "#059669" },
          { icon: "↩️", title: "Easy Returns", description: "30-day hassle-free returns.", color: "#dc2626" },
        ],
        bgColor: "",
      },
      render: ({ title, subtitle, columns, layout, features, bgColor }) => {
        const colMap: Record<number, string> = {
          2: "grid-cols-1 md:grid-cols-2",
          3: "grid-cols-1 md:grid-cols-3",
          4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
        };
        return (
          <div className="py-16 px-6" style={bgColor ? { backgroundColor: bgColor } : {}}>
            <div className="max-w-7xl mx-auto">
              {(title || subtitle) && (
                <div className="text-center mb-12">
                  {title && <h2 className="text-3xl font-heading font-bold text-zinc-900 mb-3">{title}</h2>}
                  {subtitle && <p className="text-zinc-500 text-lg">{subtitle}</p>}
                </div>
              )}
              <div className={`grid ${colMap[columns]} gap-8`}>
                {features.map((feature: { icon: string; title: string; description: string; color: string }, i: number) => (
                  <div key={i} className={`${layout === "card" ? "bg-white p-6 rounded-2xl shadow-sm border border-zinc-100" : ""} ${layout === "icon-left" ? "flex gap-4" : "text-center"}`}>
                    <div className={`${layout === "icon-top" ? "text-4xl mb-4" : layout === "icon-left" ? "text-2xl shrink-0 mt-1" : "text-3xl mb-3"}`} style={{ color: feature.color }}>
                      {feature.icon}
                    </div>
                    <div className={layout === "icon-left" ? "flex-1" : ""}>
                      <h3 className="text-xl font-bold text-zinc-900 mb-2">{feature.title}</h3>
                      <p className="text-zinc-600 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      },
    },
    // Testimonials Block
    TestimonialsBlock: {
      fields: {
        title: { type: "text", label: "Section Title" },
        subtitle: { type: "text", label: "Section Subtitle" },
        layout: {
          type: "select", label: "Layout",
          options: [
            { label: "Grid", value: "grid" },
            { label: "Carousel", value: "carousel" },
            { label: "Masonry", value: "masonry" },
          ],
        },
        columns: {
          type: "select", label: "Columns",
          options: [{ label: "2 Columns", value: 2 }, { label: "3 Columns", value: 3 }],
        },
        testimonials: {
          type: "array", label: "Testimonials",
          getItemSummary: (item) => item.name || "Testimonial",
          arrayFields: {
            name: { type: "text", label: "Customer Name" },
            role: { type: "text", label: "Role/Title" },
            text: { type: "textarea", label: "Testimonial Text" },
            rating: { type: "number", label: "Rating (1-5)" },
            avatar: { type: "text", label: "Avatar Image URL" },
          },
        },
        bgColor: { type: "text", label: "Background Color (hex)" },
      },
      defaultProps: {
        title: "What Our Customers Say",
        subtitle: "Trusted by thousands",
        layout: "grid",
        columns: 3,
        testimonials: [
          { name: "Sarah M.", role: "Verified Buyer", text: "Absolutely love the quality! Fast shipping.", rating: 5, avatar: "" },
          { name: "James K.", role: "Verified Buyer", text: "Best purchase I've made this year.", rating: 5, avatar: "" },
          { name: "Priya L.", role: "Verified Buyer", text: "Great customer service. Highly recommend!", rating: 4, avatar: "" },
        ],
        bgColor: "",
      },
      render: ({ title, subtitle, columns, testimonials, bgColor }) => {
        const colMap: Record<number, string> = {
          2: "grid-cols-1 md:grid-cols-2",
          3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        };
        return (
          <div className="py-16 px-6" style={bgColor ? { backgroundColor: bgColor } : {}}>
            <div className="max-w-7xl mx-auto">
              {(title || subtitle) && (
                <div className="text-center mb-12">
                  {title && <h2 className="text-3xl font-heading font-bold text-zinc-900 mb-3">{title}</h2>}
                  {subtitle && <p className="text-zinc-500 text-lg">{subtitle}</p>}
                </div>
              )}
              <div className={`grid ${colMap[columns]} gap-6`}>
                {testimonials.map((testimonial: { name: string; role: string; text: string; rating: number; avatar: string }, i: number) => (
                  <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-linear-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white font-bold">
                        {testimonial.avatar ? (
                          <img src={testimonial.avatar} alt={testimonial.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          testimonial.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-zinc-900">{testimonial.name}</p>
                        <p className="text-sm text-zinc-500">{testimonial.role}</p>
                      </div>
                    </div>
                    <StarRating rating={testimonial.rating} />
                    <p className="text-zinc-600 mt-3 leading-relaxed">"{testimonial.text}"</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      },
    },

    // Newsletter Block
    NewsletterBlock: {
      fields: {
        title:       { type: "text", label: "Title" },
        subtitle:    { type: "text", label: "Subtitle" },
        placeholder: { type: "text", label: "Email Placeholder" },
        buttonText:  { type: "text", label: "Button Text" },
        bgColor: f(colorPickerField({ label: "Background Color", icon: <Palette size={14} /> })),
        layout: f(buttonGroupField({
          label: "Layout",
          options: [
            { value: "inline",  label: "Inline" },
            { value: "stacked", label: "Stacked" },
            { value: "card",    label: "Card" },
          ],
        })),
      },
      defaultProps: {
        title: "Stay in the Loop",
        subtitle: "Get exclusive deals straight to your inbox.",
        placeholder: "Enter your email",
        buttonText: "Subscribe",
        bgColor: "#f4f4f5",
        layout: "inline",
      },
      render: ({ title, subtitle, placeholder, buttonText, bgColor, layout }) => (
        <div className="py-16 px-6" style={{ backgroundColor: bgColor }}>
          <div className="max-w-2xl mx-auto text-center">
            {title && <h2 className="text-3xl font-heading font-bold text-zinc-900 mb-3">{title}</h2>}
            {subtitle && <p className="text-zinc-600 mb-8">{subtitle}</p>}
            <div className={`${layout === "stacked" ? "space-y-4" : layout === "card" ? "bg-white p-8 rounded-2xl shadow-lg space-y-4" : "flex gap-3 max-w-md mx-auto"}`}>
              <input
                type="email"
                placeholder={placeholder}
                className={`${layout === "inline" ? "flex-1" : "w-full"} px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
              />
              <button className={`${layout === "inline" ? "" : "w-full"} bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors`}>
                {buttonText}
              </button>
            </div>
          </div>
        </div>
      ),
    },

    // Banner Block
    BannerBlock: {
      fields: {
        title:    { type: "text", label: "Title" },
        subtitle: { type: "text", label: "Subtitle" },
        ctaText:  { type: "text", label: "Button Text" },
        ctaLink:  { type: "text", label: "Button Link" },
        bgColor:   f(colorPickerField({ label: "Background Color", icon: <Palette size={14} /> })),
        textColor: f(colorPickerField({ label: "Text Color",       icon: <Palette size={14} /> })),
        image: f(fileUploaderField({ label: "Background Image", accept: "image/*", icon: <ImageIcon size={14} /> })),
        layout: f(iconRadioField({
          label: "Text Alignment",
          options: [
            { value: "left",   icon: <AlignLeft size={14} />,   label: "Left" },
            { value: "center", icon: <AlignCenter size={14} />, label: "Center" },
            { value: "right",  icon: <AlignRight size={14} />,  label: "Right" },
          ],
        })),
      },
      defaultProps: {
        title: "Special Offer",
        subtitle: "Don't miss out on this limited-time deal!",
        ctaText: "Shop Now",
        ctaLink: "#",
        bgColor: "#7c3aed",
        textColor: "#ffffff",
        image: "",
        layout: "center",
      },
      render: ({ title, subtitle, ctaText, ctaLink, bgColor, textColor, image, layout }) => {
        const alignClass = layout === "left" ? "text-left" : layout === "right" ? "text-right" : "text-center";
        const bgStyle = image 
          ? { backgroundImage: `url(${image})`, backgroundSize: "cover", backgroundPosition: "center" }
          : { backgroundColor: bgColor };
        
        return (
          <div className={`py-16 px-6 relative overflow-hidden ${alignClass}`} style={bgStyle}>
            {image && <div className="absolute inset-0 bg-black/40" />}
            <div className="relative z-10 max-w-4xl mx-auto">
              {title && <h2 className="text-4xl font-heading font-bold mb-3" style={{ color: textColor }}>{title}</h2>}
              {subtitle && <p className="text-lg mb-6 opacity-90" style={{ color: textColor }}>{subtitle}</p>}
              {ctaText && (
                <a
                  href={ctaLink || "#"}
                  className="inline-flex items-center gap-2 bg-white text-zinc-900 px-8 py-4 rounded-xl font-semibold hover:bg-zinc-100 transition-colors"
                >
                  {ctaText}
                  <ArrowRight className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        );
      },
    },

    // FAQ Block
    FAQBlock: {
      fields: {
        title: { type: "text", label: "Section Title" },
        subtitle: { type: "text", label: "Section Subtitle" },
        items: {
          type: "array", label: "FAQ Items",
          getItemSummary: (item) => item.question || "FAQ",
          arrayFields: {
            question: { type: "text", label: "Question" },
            answer: { type: "textarea", label: "Answer" },
          },
        },
        layout: {
          type: "select", label: "Layout",
          options: [
            { label: "Accordion", value: "accordion" },
            { label: "Grid", value: "grid" },
          ],
        },
      },
      defaultProps: {
        title: "Frequently Asked Questions",
        subtitle: "Everything you need to know",
        items: [
          { question: "How long does shipping take?", answer: "We offer free standard shipping (5-7 business days) and express shipping (2-3 business days)." },
          { question: "What's your return policy?", answer: "We offer 30-day hassle-free returns on all items in original condition." },
          { question: "Do you ship internationally?", answer: "Yes, we ship to over 50 countries worldwide. Shipping costs vary by location." },
        ],
        layout: "accordion",
      },
      render: ({ title, subtitle, items, layout }) => (
        <div className="py-16 px-6">
          <div className="max-w-4xl mx-auto">
            {(title || subtitle) && (
              <div className="text-center mb-12">
                {title && <h2 className="text-3xl font-heading font-bold text-zinc-900 mb-3">{title}</h2>}
                {subtitle && <p className="text-zinc-500 text-lg">{subtitle}</p>}
              </div>
            )}
            <div className={layout === "grid" ? "grid md:grid-cols-2 gap-6" : "space-y-4"}>
              {items.map((item: { question: string; answer: string }, i: number) => (
                <div key={i} className="bg-white border border-zinc-200 rounded-2xl p-6">
                  <h3 className="font-semibold text-zinc-900 mb-3">{item.question}</h3>
                  <p className="text-zinc-600 leading-relaxed">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    },

    // Trust Badges
    TrustBadges: {
      fields: {
        badges: {
          type: "array", label: "Trust Badges",
          getItemSummary: (item) => item.title || "Badge",
          arrayFields: {
            icon:     { type: "text", label: "Icon (emoji)" },
            title:    { type: "text", label: "Title" },
            subtitle: { type: "text", label: "Subtitle" },
          },
        },
        layout: f(buttonGroupField({
          label: "Layout",
          options: [
            { value: "horizontal", label: "Row" },
            { value: "grid",       label: "Grid" },
          ],
        })),
        bgColor: f(colorPickerField({ label: "Background Color", icon: <Palette size={14} /> })),
      },
      defaultProps: {
        badges: [
          { icon: "🔒", title: "Secure Checkout", subtitle: "SSL Protected" },
          { icon: "🚚", title: "Free Shipping", subtitle: "Orders over $50" },
          { icon: "↩️", title: "Easy Returns", subtitle: "30-day policy" },
          { icon: "⭐", title: "5-Star Rated", subtitle: "1000+ reviews" },
        ],
        layout: "horizontal",
        bgColor: "#f9fafb",
      },
      render: ({ badges, layout, bgColor }) => (
        <div className="py-12 px-6" style={{ backgroundColor: bgColor }}>
          <div className={`max-w-6xl mx-auto grid ${layout === "grid" ? "grid-cols-2 md:grid-cols-4 gap-6" : "grid-cols-2 md:grid-cols-4 gap-4"}`}>
            {badges.map((badge: { icon: string; title: string; subtitle: string }, i: number) => (
              <div key={i} className="text-center">
                <div className="text-2xl mb-2">{badge.icon}</div>
                <p className="font-semibold text-zinc-900 text-sm">{badge.title}</p>
                <p className="text-xs text-zinc-500">{badge.subtitle}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },

    // Social Links
    SocialLinks: {
      fields: {
        instagram: { type: "text", label: "Instagram URL" },
        twitter: { type: "text", label: "Twitter URL" },
        facebook: { type: "text", label: "Facebook URL" },
        youtube: { type: "text", label: "YouTube URL" },
        align: {
          type: "radio", label: "Alignment",
          options: [{ label: "Left", value: "left" }, { label: "Center", value: "center" }, { label: "Right", value: "right" }],
        },
        size: {
          type: "select", label: "Size",
          options: [{ label: "Small", value: "sm" }, { label: "Medium", value: "md" }, { label: "Large", value: "lg" }],
        },
        style: {
          type: "select", label: "Style",
          options: [
            { label: "Filled", value: "filled" },
            { label: "Outline", value: "outline" },
            { label: "Ghost", value: "ghost" },
          ],
        },
        color: { type: "text", label: "Color (hex)" },
      },
      defaultProps: {
        instagram: "",
        twitter: "",
        facebook: "",
        youtube: "",
        align: "center",
        size: "md",
        style: "filled",
        color: "#7c3aed",
      },
      render: ({ instagram, twitter, facebook, youtube, align, size, style, color }) => {
        const alignClass = align === "left" ? "justify-start" : align === "right" ? "justify-end" : "justify-center";
        const sizeClass = size === "sm" ? "w-8 h-8" : size === "lg" ? "w-12 h-12" : "w-10 h-10";
        const iconSize = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-6 h-6" : "w-5 h-5";
        
        const getButtonClass = () => {
          if (style === "filled") return `text-white hover:opacity-80`;
          if (style === "outline") return `border-2 text-zinc-600 hover:bg-zinc-50`;
          return `text-zinc-600 hover:bg-zinc-100`;
        };

        const links = [
          { url: instagram, icon: Instagram, name: "Instagram" },
          { url: twitter, icon: Twitter, name: "Twitter" },
          { url: facebook, icon: Facebook, name: "Facebook" },
          { url: youtube, icon: Youtube, name: "YouTube" },
        ].filter(link => link.url);

        return (
          <div className={`flex gap-3 py-6 px-6 ${alignClass}`}>
            {links.map(({ url, icon: Icon, name }) => (
              <a
                key={name}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${sizeClass} rounded-full flex items-center justify-center transition-all ${getButtonClass()}`}
                style={style === "filled" ? { backgroundColor: color } : style === "outline" ? { borderColor: color } : {}}
              >
                <Icon className={iconSize} />
              </a>
            ))}
          </div>
        );
      },
    },

    // Countdown Block
    CountdownBlock: {
      fields: {
        title:      { type: "text", label: "Title" },
        targetDate: { type: "text", label: "Target Date (YYYY-MM-DD HH:MM)" },
        bgColor:    f(colorPickerField({ label: "Background Color", icon: <Palette size={14} /> })),
        textColor:  f(colorPickerField({ label: "Text Color",       icon: <Palette size={14} /> })),
        showDays:    f(toggleButtonField({ label: "Show Days",    onLabel: "Yes", offLabel: "No" })),
        showHours:   f(toggleButtonField({ label: "Show Hours",   onLabel: "Yes", offLabel: "No" })),
        showMinutes: f(toggleButtonField({ label: "Show Minutes", onLabel: "Yes", offLabel: "No" })),
        showSeconds: f(toggleButtonField({ label: "Show Seconds", onLabel: "Yes", offLabel: "No" })),
      },
      defaultProps: {
        title: "Limited Time Offer",
        targetDate: "2024-12-31 23:59",
        bgColor: "#7c3aed",
        textColor: "#ffffff",
        showDays: true,
        showHours: true,
        showMinutes: true,
        showSeconds: true,
      },
      render: ({ title, bgColor, textColor, showDays, showHours, showMinutes, showSeconds }) => {
        // Mock countdown for preview
        const timeUnits = [
          { value: "15", label: "Days", show: showDays },
          { value: "08", label: "Hours", show: showHours },
          { value: "42", label: "Minutes", show: showMinutes },
          { value: "33", label: "Seconds", show: showSeconds },
        ].filter(unit => unit.show);

        return (
          <div className="py-16 px-6" style={{ backgroundColor: bgColor }}>
            <div className="max-w-4xl mx-auto text-center">
              {title && <h2 className="text-3xl font-heading font-bold mb-8" style={{ color: textColor }}>{title}</h2>}
              <div className="flex justify-center gap-4 md:gap-8">
                {timeUnits.map((unit, i) => (
                  <div key={i} className="text-center">
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 md:p-6 min-w-20 md:min-w-25">
                      <div className="text-3xl md:text-5xl font-bold font-mono" style={{ color: textColor }}>{unit.value}</div>
                    </div>
                    <p className="text-sm md:text-base mt-2 opacity-80" style={{ color: textColor }}>{unit.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      },
    },

    // Image Gallery
    ImageGallery: {
      fields: {
        title: { type: "text", label: "Gallery Title" },
        images: {
          type: "array", label: "Images",
          getItemSummary: (item) => item.alt || "Image",
          arrayFields: {
            src: { type: "text", label: "Image URL" },
            alt: { type: "text", label: "Alt Text" },
            caption: { type: "text", label: "Caption" },
          },
        },
        columns: {
          type: "select", label: "Columns",
          options: [{ label: "2 Columns", value: 2 }, { label: "3 Columns", value: 3 }, { label: "4 Columns", value: 4 }],
        },
        gap: {
          type: "select", label: "Gap",
          options: [{ label: "Small", value: "sm" }, { label: "Medium", value: "md" }, { label: "Large", value: "lg" }],
        },
        rounded: {
          type: "select", label: "Border Radius",
          options: [{ label: "None", value: "none" }, { label: "Small", value: "sm" }, { label: "Medium", value: "md" }, { label: "Large", value: "lg" }],
        },
      },
      defaultProps: {
        title: "Gallery",
        images: [
          { src: "", alt: "Gallery Image 1", caption: "Beautiful moment captured" },
          { src: "", alt: "Gallery Image 2", caption: "Another great shot" },
          { src: "", alt: "Gallery Image 3", caption: "Perfect lighting" },
          { src: "", alt: "Gallery Image 4", caption: "Stunning composition" },
        ],
        columns: 3,
        gap: "md",
        rounded: "lg",
      },
      render: ({ title, images, columns, gap, rounded }) => {
        const colMap: Record<number, string> = {
          2: "grid-cols-1 md:grid-cols-2",
          3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
          4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
        };
        const gapMap: Record<string, string> = { sm: "gap-3", md: "gap-6", lg: "gap-8" };
        const roundedMap: Record<string, string> = { none: "", sm: "rounded-sm", md: "rounded-md", lg: "rounded-2xl" };

        return (
          <div className="py-16 px-6">
            <div className="max-w-7xl mx-auto">
              {title && <h2 className="text-3xl font-heading font-bold text-zinc-900 text-center mb-12">{title}</h2>}
              <div className={`grid ${colMap[columns]} ${gapMap[gap]}`}>
                {images.map((image: { src: string; alt: string; caption: string }, i: number) => (
                  <div key={i} className="group cursor-pointer">
                    <div className={`aspect-square bg-linear-to-br from-zinc-100 to-zinc-200 overflow-hidden ${roundedMap[rounded]} group-hover:shadow-xl transition-all duration-300`}>
                      {image.src ? (
                        <img src={image.src} alt={image.alt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-center text-zinc-400">
                            <Eye className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-sm">Add image URL</p>
                          </div>
                        </div>
                      )}
                    </div>
                    {image.caption && <p className="text-sm text-zinc-500 text-center mt-3">{image.caption}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      },
    },

    // Contact Section
    ContactSection: {
      fields: {
        title: { type: "text", label: "Section Title" },
        subtitle: { type: "text", label: "Section Subtitle" },
        email: { type: "text", label: "Email Address" },
        phone: { type: "text", label: "Phone Number" },
        address: { type: "textarea", label: "Address" },
        showForm: { type: "radio", label: "Show Contact Form", options: [{ label: "Yes", value: true }, { label: "No", value: false }] },
        bgColor: { type: "text", label: "Background Color (hex)" },
      },
      defaultProps: {
        title: "Get in Touch",
        subtitle: "We'd love to hear from you. Send us a message and we'll respond as soon as possible.",
        email: "hello@yourstore.com",
        phone: "+1 (555) 123-4567",
        address: "123 Main Street\nYour City, State 12345\nUnited States",
        showForm: true,
        bgColor: "",
      },
      render: ({ title, subtitle, email, phone, address, showForm, bgColor }) => (
        <div className="py-16 px-6" style={bgColor ? { backgroundColor: bgColor } : {}}>
          <div className="max-w-6xl mx-auto">
            {(title || subtitle) && (
              <div className="text-center mb-12">
                {title && <h2 className="text-3xl font-heading font-bold text-zinc-900 mb-3">{title}</h2>}
                {subtitle && <p className="text-zinc-600 text-lg max-w-2xl mx-auto">{subtitle}</p>}
              </div>
            )}
            <div className={`grid ${showForm ? "lg:grid-cols-2" : "lg:grid-cols-3"} gap-12`}>
              {/* Contact Info */}
              <div className="space-y-8">
                {email && (
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
                      <Mail className="w-6 h-6 text-violet-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-900 mb-1">Email</h3>
                      <a href={`mailto:${email}`} className="text-zinc-600 hover:text-violet-600 transition-colors">{email}</a>
                    </div>
                  </div>
                )}
                {phone && (
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
                      <Phone className="w-6 h-6 text-violet-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-900 mb-1">Phone</h3>
                      <a href={`tel:${phone}`} className="text-zinc-600 hover:text-violet-600 transition-colors">{phone}</a>
                    </div>
                  </div>
                )}
                {address && (
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
                      <MapPin className="w-6 h-6 text-violet-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-900 mb-1">Address</h3>
                      <p className="text-zinc-600 whitespace-pre-line">{address}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Contact Form */}
              {showForm && (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-100">
                  <form className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <input type="text" placeholder="First Name" className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
                      <input type="text" placeholder="Last Name" className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
                    </div>
                    <input type="email" placeholder="Email Address" className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
                    <input type="text" placeholder="Subject" className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
                    <textarea placeholder="Your Message" rows={5} className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"></textarea>
                    <button type="submit" className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-xl font-semibold transition-colors">
                      Send Message
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      ),
    },

    // Two Column Section
    TwoColumnSection: {
      fields: {
        leftContent: { type: "textarea", label: "Left Column Content" },
        rightContent: { type: "textarea", label: "Right Column Content" },
        leftImage: { type: "text", label: "Left Column Image URL" },
        rightImage: { type: "text", label: "Right Column Image URL" },
        gap: {
          type: "select", label: "Gap Between Columns",
          options: [{ label: "Small", value: "sm" }, { label: "Medium", value: "md" }, { label: "Large", value: "lg" }],
        },
        verticalAlign: {
          type: "select", label: "Vertical Alignment",
          options: [{ label: "Top", value: "top" }, { label: "Center", value: "center" }, { label: "Bottom", value: "bottom" }],
        },
        reverseOnMobile: { type: "radio", label: "Reverse Order on Mobile", options: [{ label: "Yes", value: true }, { label: "No", value: false }] },
        leftWidth: {
          type: "select", label: "Left Column Width",
          options: [{ label: "1/3", value: "1/3" }, { label: "1/2", value: "1/2" }, { label: "2/3", value: "2/3" }],
        },
      },
      defaultProps: {
        leftContent: "This is the left column content. You can add text, images, or any other content here.",
        rightContent: "This is the right column content. Perfect for balancing your layout with complementary information.",
        leftImage: "",
        rightImage: "",
        gap: "md",
        verticalAlign: "center",
        reverseOnMobile: false,
        leftWidth: "1/2",
      },
      render: ({ leftContent, rightContent, leftImage, rightImage, gap, verticalAlign, reverseOnMobile, leftWidth }) => {
        const gapMap: Record<string, string> = { sm: "gap-6", md: "gap-12", lg: "gap-16" };
        const alignMap: Record<string, string> = { top: "items-start", center: "items-center", bottom: "items-end" };
        const widthMap: Record<string, string> = { "1/3": "lg:grid-cols-[1fr_2fr]", "1/2": "lg:grid-cols-2", "2/3": "lg:grid-cols-[2fr_1fr]" };

        return (
          <div className="py-16 px-6">
            <div className="max-w-7xl mx-auto">
              <div className={`grid grid-cols-1 ${widthMap[leftWidth]} ${gapMap[gap]} ${alignMap[verticalAlign]} ${reverseOnMobile ? "flex-col-reverse lg:flex-row" : ""}`}>
                {/* Left Column */}
                <div className="space-y-6">
                  {leftImage && (
                    <div className="aspect-video bg-zinc-100 rounded-2xl overflow-hidden">
                      <img src={leftImage} alt="Left column" className="w-full h-full object-cover" />
                    </div>
                  )}
                  {leftContent && (
                    <div className="prose prose-zinc max-w-none">
                      {leftContent.split('\n').map((paragraph: string, i: number) => (
                        <p key={i} className="text-zinc-600 leading-relaxed mb-4 last:mb-0">{paragraph}</p>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {rightImage && (
                    <div className="aspect-video bg-zinc-100 rounded-2xl overflow-hidden">
                      <img src={rightImage} alt="Right column" className="w-full h-full object-cover" />
                    </div>
                  )}
                  {rightContent && (
                    <div className="prose prose-zinc max-w-none">
                      {rightContent.split('\n').map((paragraph: string, i: number) => (
                        <p key={i} className="text-zinc-600 leading-relaxed mb-4 last:mb-0">{paragraph}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      },
    },

    // Category Grid
    CategoryGrid: {
      fields: {
        title: { type: "text", label: "Section Title" },
        subtitle: { type: "text", label: "Section Subtitle" },
        categories: {
          type: "array", label: "Categories",
          getItemSummary: (item) => item.name || "Category",
          arrayFields: {
            name: { type: "text", label: "Category Name" },
            image: { type: "text", label: "Category Image URL" },
            link: { type: "text", label: "Category Link" },
            count: { type: "number", label: "Product Count" },
          },
        },
        columns: {
          type: "select", label: "Columns",
          options: [{ label: "2 Columns", value: 2 }, { label: "3 Columns", value: 3 }, { label: "4 Columns", value: 4 }],
        },
        style: {
          type: "select", label: "Card Style",
          options: [
            { label: "Card", value: "card" },
            { label: "Overlay", value: "overlay" },
            { label: "Minimal", value: "minimal" },
          ],
        },
      },
      defaultProps: {
        title: "Shop by Category",
        subtitle: "Discover our curated collections",
        categories: [
          { name: "Electronics", image: "", link: "/category/electronics", count: 45 },
          { name: "Fashion", image: "", link: "/category/fashion", count: 128 },
          { name: "Home & Garden", image: "", link: "/category/home", count: 67 },
          { name: "Sports", image: "", link: "/category/sports", count: 89 },
        ],
        columns: 3,
        style: "card",
      },
      render: ({ title, subtitle, categories, columns, style }) => {
        const colMap: Record<number, string> = {
          2: "grid-cols-1 md:grid-cols-2",
          3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
          4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
        };

        return (
          <div className="py-16 px-6">
            <div className="max-w-7xl mx-auto">
              {(title || subtitle) && (
                <div className="text-center mb-12">
                  {title && <h2 className="text-3xl font-heading font-bold text-zinc-900 mb-3">{title}</h2>}
                  {subtitle && <p className="text-zinc-500 text-lg">{subtitle}</p>}
                </div>
              )}
              <div className={`grid ${colMap[columns]} gap-6`}>
                {categories.map((category: { name: string; image: string; link: string; count: number }, i: number) => (
                  <a key={i} href={category.link || "#"} className="group">
                    {style === "card" && (
                      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-zinc-100 group-hover:shadow-xl transition-all duration-300">
                        <div className="aspect-square bg-linear-to-br from-zinc-100 to-zinc-200 relative overflow-hidden">
                          {category.image ? (
                            <img src={category.image} alt={category.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Tag className="w-12 h-12 text-zinc-300" />
                            </div>
                          )}
                        </div>
                        <div className="p-6 text-center">
                          <h3 className="font-semibold text-zinc-900 mb-1">{category.name}</h3>
                          <p className="text-sm text-zinc-500">{category.count} products</p>
                        </div>
                      </div>
                    )}
                    {style === "overlay" && (
                      <div className="relative aspect-square rounded-2xl overflow-hidden group-hover:shadow-xl transition-all duration-300">
                        <div className="absolute inset-0 bg-linear-to-br from-zinc-100 to-zinc-200">
                          {category.image ? (
                            <img src={category.image} alt={category.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Tag className="w-12 h-12 text-zinc-300" />
                            </div>
                          )}
                        </div>
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
                        <div className="absolute inset-0 flex items-center justify-center text-center text-white">
                          <div>
                            <h3 className="text-xl font-bold mb-1">{category.name}</h3>
                            <p className="text-sm opacity-90">{category.count} products</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {style === "minimal" && (
                      <div className="text-center group-hover:scale-105 transition-transform duration-200">
                        <div className="aspect-square bg-linear-to-br from-zinc-100 to-zinc-200 rounded-2xl mb-4 overflow-hidden">
                          {category.image ? (
                            <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Tag className="w-12 h-12 text-zinc-300" />
                            </div>
                          )}
                        </div>
                        <h3 className="font-semibold text-zinc-900 mb-1">{category.name}</h3>
                        <p className="text-sm text-zinc-500">{category.count} products</p>
                      </div>
                    )}
                  </a>
                ))}
              </div>
            </div>
          </div>
        );
      },
    },
  },

  categories: {
    layout: {
      components: ["AnnouncementBar", "HeroSection", "SocialProofBar", "BannerBlock"],
    },
    content: {
      components: ["HeadingBlock", "RichTextBlock", "ButtonBlock", "ImageBlock", "VideoBlock", "DividerBlock", "SpacerBlock", "CountdownBlock", "ImageGallery", "TwoColumnSection"],
    },
    ecommerce: {
      components: ["ProductGrid", "ProductCarousel", "ProductCard", "CategoryGrid"],
    },
    sections: {
      components: ["FeatureSection", "TestimonialsBlock", "NewsletterBlock", "FAQBlock", "TrustBadges", "ContactSection"],
    },
    social: {
      components: ["SocialLinks"],
    },
  },
};

export default config;
