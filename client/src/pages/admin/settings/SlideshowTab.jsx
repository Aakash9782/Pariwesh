import React from "react";
import { RiFolderImageLine, RiDeleteBinLine } from "react-icons/ri";
import Button from "../../../components/admin/ui/Button.jsx";

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
    <form
      onSubmit={handleSaveSlideshow}
      className="space-y-6 text-slate-700 font-sans"
    >
      <div>
        <h3 className="text-xs font-bold tracking-widest uppercase text-[#c5a880] flex items-center">
          <RiFolderImageLine className="mr-2" /> Homepage Spotlight Slideshow
        </h3>
        <p className="text-slate-500 text-xs mt-1">
          Upload up to 5 featured images to rotate on the homepage luxury hero
          carousel.
        </p>
      </div>

      <div className="pt-4 border-t border-slate-200 flex justify-between items-center bg-[#FAF9F6] p-4 rounded-xl border border-slate-200/80">
        <div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
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
          className="bg-white border border-slate-200 text-xs rounded-lg p-2 text-slate-700 outline-none focus:ring-1 focus:ring-[#c5a880] focus:border-[#c5a880] font-semibold"
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
            className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col justify-between space-y-4 shadow-sm"
          >
            <div>
              <h4 className="text-xs font-bold text-slate-700">
                {slide.label}
              </h4>
            </div>

            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-slate-50 border border-slate-200 flex items-center justify-center">
              {slide.img ? (
                <img
                  src={slide.img}
                  className="w-full h-full object-cover"
                  alt={`Slide Preview ${index + 1}`}
                />
              ) : (
                <div className="text-[10px] text-slate-400 italic">
                  Empty Slot (Fallback Used)
                </div>
              )}
              {slide.img && (
                <button
                  type="button"
                  onClick={() => slide.setImg("")}
                  className="absolute top-1 right-1 bg-rose-50 border border-rose-200 text-rose-600 p-1 rounded-full hover:bg-rose-100 transition-colors"
                  title="Clear Image Slot"
                >
                  <RiDeleteBinLine size={12} />
                </button>
              )}
            </div>

            <div className="space-y-1">
              <label className="w-full text-center block bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] uppercase font-bold tracking-widest text-[#c5a880] py-1.5 rounded-lg cursor-pointer transition">
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

      <div className="flex justify-end pt-4 border-t border-slate-200">
        <Button
          type="submit"
          variant="primary"
          className="px-6 py-2.5 text-xs uppercase tracking-wider font-bold"
        >
          Save Slideshow Assets
        </Button>
      </div>
    </form>
  );
};

export default SlideshowTab;
