import React from "react";
import { RiFolderImageLine, RiDeleteBinLine } from "react-icons/ri";

const SlideshowTab = ({
  slideBarActive,
  setSlideBarActive,
  slideImg1,
  setSlideImg1,
  slideImg2,
  setSlideImg2,
  slideImg3,
  setSlideImg3,
  slideImg4,
  setSlideImg4,
  slideImg5,
  setSlideImg5,
  handleSaveSlideshow,
  handleSlideFileChange,
}) => {
  return (
    <form onSubmit={handleSaveSlideshow} className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold tracking-wide uppercase text-accent-gold flex items-center">
          <RiFolderImageLine className="mr-2" /> Homepage Spotlight Slideshow
        </h3>
        <p className="text-slate-400 text-xs mt-1">
          Upload up to 5 featured images to rotate on the homepage luxury hero
          carousel.
        </p>
      </div>

      <div className="pt-4 border-t border-slate-900 flex justify-between items-center bg-slate-900/40 p-4 rounded border border-slate-900">
        <div>
          <h4 className="text-xs font-semibold text-white">
            Carousel Slider Active Status
          </h4>
          <p className="text-[10px] text-slate-500 mt-1">
            If disabled, the spotlight image slider on the homepage will be
            hidden.
          </p>
        </div>
        <select
          value={String(slideBarActive)}
          onChange={(e) => setSlideBarActive(e.target.value === "true")}
          className="bg-slate-950 border border-slate-800 text-xs rounded p-2 text-slate-200 focus:outline-none"
        >
          <option value="true">Active (Show Slideshow)</option>
          <option value="false">Inactive (Hide Slideshow)</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          {
            img: slideImg1,
            setImg: setSlideImg1,
            label: "Slide Image Slot 1",
          },
          {
            img: slideImg2,
            setImg: setSlideImg2,
            label: "Slide Image Slot 2",
          },
          {
            img: slideImg3,
            setImg: setSlideImg3,
            label: "Slide Image Slot 3",
          },
          {
            img: slideImg4,
            setImg: setSlideImg4,
            label: "Slide Image Slot 4",
          },
          {
            img: slideImg5,
            setImg: setSlideImg5,
            label: "Slide Image Slot 5",
          },
        ].map((slide, index) => (
          <div
            key={index}
            className="bg-slate-900 border border-slate-850 p-4 rounded-lg flex flex-col justify-between space-y-4"
          >
            <div>
              <h4 className="text-xs font-semibold text-slate-350">
                {slide.label}
              </h4>
            </div>

            <div className="relative w-full aspect-video rounded overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
              {slide.img ? (
                <img
                  src={slide.img}
                  className="w-full h-full object-cover"
                  alt={`Slide Preview ${index + 1}`}
                />
              ) : (
                <div className="text-[10px] text-slate-600 italic">
                  Empty Slot (Fallback Used)
                </div>
              )}
              {slide.img && (
                <button
                  type="button"
                  onClick={() => slide.setImg("")}
                  className="absolute top-1 right-1 bg-red-950/80 border border-red-500/35 text-red-450 p-1 rounded-full hover:bg-red-900 transition-colors"
                  title="Clear Image Slot"
                >
                  <RiDeleteBinLine size={12} />
                </button>
              )}
            </div>

            <div className="space-y-1">
              <label className="w-full text-center block bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] uppercase font-extrabold tracking-widest text-accent-gold py-1.5 rounded cursor-pointer transition">
                Choose Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleSlideFileChange(e, index)}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-900">
        <button
          type="submit"
          className="bg-accent-gold text-slate-950 text-xs font-bold py-2.5 px-6.5 rounded-lg transition hover:bg-yellow-500"
        >
          Save Slideshow Assets
        </button>
      </div>
    </form>
  );
};

export default SlideshowTab;
