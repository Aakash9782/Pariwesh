import React from "react";
import Button from "../../../components/admin/ui/Button.jsx";
import Input from "../../../components/admin/ui/Input.jsx";

const HomepageTab = ({
  storyImage,
  setStoryImage,
  categories,
  setCategories,
  vibeMoods,
  setVibeMoods,
  campaignBanners,
  setCampaignBanners,
  campaignBannersActive,
  setCampaignBannersActive,
  handleSaveHomepage,
}) => {
  const handleAddCampaignBanner = () => {
    setCampaignBanners([
      ...(campaignBanners || []),
      {
        title: "New Campaign Section",
        subtitle: "FRESH DESIGNS",
        path: "/shop",
        image: "",
      },
    ]);
  };

  const handleDeleteCampaignBanner = (idxToDelete) => {
    const updated = campaignBanners.filter((_, idx) => idx !== idxToDelete);
    setCampaignBanners(updated);
  };
  const handleStoryFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setStoryImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCategoryImageChange = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const copy = [...categories];
        copy[index] = { ...copy[index], image: reader.result };
        setCategories(copy);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCategoryFieldChange = (index, field, value) => {
    const copy = [...categories];
    copy[index] = { ...copy[index], [field]: value };
    setCategories(copy);
  };

  const handleMoodImageChange = (e, index, imgKey) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const copy = [...vibeMoods];
        copy[index] = { ...copy[index], [imgKey]: reader.result };
        setVibeMoods(copy);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMoodFieldChange = (index, field, value) => {
    const copy = [...vibeMoods];
    copy[index] = { ...copy[index], [field]: value };
    setVibeMoods(copy);
  };

  const handleCampaignImageChange = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const copy = [...campaignBanners];
        copy[index] = { ...copy[index], image: reader.result };
        setCampaignBanners(copy);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCampaignFieldChange = (index, field, value) => {
    const copy = [...campaignBanners];
    copy[index] = { ...copy[index], [field]: value };
    setCampaignBanners(copy);
  };

  return (
    <form
      onSubmit={handleSaveHomepage}
      className="space-y-10 max-w-4xl text-slate-700 font-sans"
    >
      {/* STORY IMAGE SECTION */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold tracking-widest uppercase text-[#c5a880]">
          Pariwesh Edit Story Image
        </h3>
        <p className="text-[11px] text-slate-500 max-w-xl">
          This image appears on the left side of "The Pariwesh Edit" section
          describing the brand's handcrafted story.
        </p>

        <div className="flex items-start space-x-5">
          {storyImage ? (
            <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg shadow-sm w-36 h-48 overflow-hidden flex items-center justify-center shrink-0">
              <img
                src={storyImage}
                className="w-full h-full object-cover"
                alt="Story preview"
              />
            </div>
          ) : (
            <div className="w-36 h-48 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-[10px] text-slate-400 italic font-medium shrink-0">
              No Image Loaded
            </div>
          )}

          <label className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] uppercase font-bold tracking-widest text-[#c5a880] py-2 px-4.5 rounded-lg cursor-pointer transition self-end">
            Choose Photo
            <input
              type="file"
              accept="image/*"
              onChange={handleStoryFileChange}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* CATEGORY SECTIONS (Boutique Curations) */}
      <div className="space-y-6 pt-8 border-t border-slate-100">
        <div>
          <h3 className="text-sm font-bold tracking-widest uppercase text-[#c5a880]">
            Boutique Curations (Categories)
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">
            Configure titles, paths, and preview images for the 5 categories on
            the homepage.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map((cat, idx) => (
            <div
              key={idx}
              className="p-4 bg-[#FAF9F6] border border-slate-200/80 rounded-xl space-y-4"
            >
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-black tracking-widest text-[#c5a880]">
                  Category Item #{idx + 1}
                </span>
              </div>

              <div className="flex items-center space-x-4">
                {cat.image ? (
                  <div className="w-16 h-16 rounded-full overflow-hidden border border-slate-200 shrink-0">
                    <img
                      src={cat.image}
                      className="w-full h-full object-cover"
                      alt={`Cart preview ${idx}`}
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center text-[8px] text-slate-400 italic">
                    No Image
                  </div>
                )}
                <label className="bg-white hover:bg-slate-50 border border-slate-200 text-[8px] uppercase font-black tracking-widest text-slate-600 py-1.5 px-3 rounded-lg cursor-pointer transition">
                  Change Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleCategoryImageChange(e, idx)}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Title"
                  value={cat.title || ""}
                  onChange={(e) =>
                    handleCategoryFieldChange(idx, "title", e.target.value)
                  }
                />
                <Input
                  label="Navigation URL Path"
                  value={cat.path || ""}
                  onChange={(e) =>
                    handleCategoryFieldChange(idx, "path", e.target.value)
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* VIBE GRID SECTIONS (Moods) */}
      <div className="space-y-6 pt-8 border-t border-slate-100">
        <div>
          <h3 className="text-sm font-bold tracking-widest uppercase text-[#c5a880]">
            Pick Your Vibe (Mood Grids)
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">
            Configure titles, paths, background images, and inset foreground
            images for the 4 mood blocks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {vibeMoods.map((mood, idx) => (
            <div
              key={idx}
              className="p-4 bg-[#FAF9F6] border border-slate-200/80 rounded-xl space-y-4"
            >
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-black tracking-widest text-[#c5a880]">
                  Vibe Mood #{idx + 1}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Background Image */}
                <div className="space-y-2">
                  <label className="text-[9px] uppercase font-bold text-slate-500 block">
                    Background Image
                  </label>
                  {mood.bgImg ? (
                    <div className="w-full h-24 bg-white border border-slate-200 rounded overflow-hidden flex items-center justify-center">
                      <img
                        src={mood.bgImg}
                        className="w-full h-full object-cover filter grayscale"
                        alt="BG Preview"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-24 bg-slate-100 border border-slate-200 rounded flex items-center justify-center text-[8px] text-slate-400 italic">
                      No BG
                    </div>
                  )}
                  <label className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-[8px] uppercase font-black tracking-widest text-slate-600 py-1.5 px-3 rounded-lg cursor-pointer transition text-center block">
                    Upload BG
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleMoodImageChange(e, idx, "bgImg")}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Inset Image */}
                <div className="space-y-2">
                  <label className="text-[9px] uppercase font-bold text-slate-500 block">
                    Foreground Inset Photo
                  </label>
                  {mood.insetImg ? (
                    <div className="w-full h-24 bg-white border border-slate-200 rounded overflow-hidden flex items-center justify-center">
                      <img
                        src={mood.insetImg}
                        className="w-full h-full object-cover"
                        alt="Inset Preview"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-24 bg-slate-100 border border-slate-200 rounded flex items-center justify-center text-[8px] text-slate-400 italic">
                      No Inset
                    </div>
                  )}
                  <label className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-[8px] uppercase font-black tracking-widest text-slate-600 py-1.5 px-3 rounded-lg cursor-pointer transition text-center block">
                    Upload Inset
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleMoodImageChange(e, idx, "insetImg")
                      }
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Title"
                  value={mood.title || ""}
                  onChange={(e) =>
                    handleMoodFieldChange(idx, "title", e.target.value)
                  }
                />
                <Input
                  label="Navigation URL Path"
                  value={mood.path || ""}
                  onChange={(e) =>
                    handleMoodFieldChange(idx, "path", e.target.value)
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CAMPAIGN BANNERS SECTIONS */}
      <div className="space-y-6 pt-8 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold tracking-widest uppercase text-[#c5a880]">
              Home Campaign Banners (Swipe Slider)
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Configure titles, subtitles, navigation paths, and preview images
              for marketing banners.
            </p>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {campaignBannersActive ? "Active" : "Inactive"}
            </span>
            <button
              type="button"
              onClick={() => setCampaignBannersActive(!campaignBannersActive)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                campaignBannersActive ? "bg-[#c5a880]" : "bg-slate-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  campaignBannersActive ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.isArray(campaignBanners) &&
            campaignBanners.map((banner, idx) => (
              <div
                key={idx}
                className="p-4 bg-[#FAF9F6] border border-slate-200/80 rounded-xl space-y-4 relative"
              >
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-black tracking-widest text-[#c5a880]">
                    Campaign Banner #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteCampaignBanner(idx)}
                    className="text-[9px] font-bold text-rose-500 hover:text-rose-700 uppercase tracking-wider transition"
                  >
                    Remove
                  </button>
                </div>

                <div className="flex items-center space-x-4">
                  {banner.image ? (
                    <div className="w-20 h-24 rounded border border-slate-200 shrink-0 overflow-hidden">
                      <img
                        src={banner.image}
                        className="w-full h-full object-cover"
                        alt={`Campaign preview ${idx}`}
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-24 bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center text-[8px] text-slate-400 italic">
                      No Image
                    </div>
                  )}
                  <label className="bg-white hover:bg-slate-50 border border-slate-200 text-[8px] uppercase font-black tracking-widest text-[#c5a880] py-1.5 px-3 rounded-lg cursor-pointer transition">
                    Change Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleCampaignImageChange(e, idx)}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Title"
                    value={banner.title || ""}
                    onChange={(e) =>
                      handleCampaignFieldChange(idx, "title", e.target.value)
                    }
                  />
                  <Input
                    label="Subtitle (e.g. SUMMER COLLECTION)"
                    value={banner.subtitle || ""}
                    onChange={(e) =>
                      handleCampaignFieldChange(idx, "subtitle", e.target.value)
                    }
                  />
                </div>
                <Input
                  label="Navigation URL Path"
                  value={banner.path || ""}
                  onChange={(e) =>
                    handleCampaignFieldChange(idx, "path", e.target.value)
                  }
                />
              </div>
            ))}

          {/* Add Campaign Banner button card */}
          <button
            type="button"
            onClick={handleAddCampaignBanner}
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#c5a880]/30 hover:border-[#c5a880] rounded-xl hover:bg-[#FAF9F6]/50 transition duration-300 min-h-[220px] text-center space-y-2 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-[#c5a880]/10 flex items-center justify-center text-[#c5a880] group-hover:scale-110 transition-transform">
              <span className="text-xl font-bold">+</span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#c5a880]">
              Add Campaign Banner
            </span>
          </button>
        </div>
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          className="px-6 py-2.5 text-xs uppercase tracking-wider font-bold"
        >
          Save Homepage Curations
        </Button>
      </div>
    </form>
  );
};

export default HomepageTab;
