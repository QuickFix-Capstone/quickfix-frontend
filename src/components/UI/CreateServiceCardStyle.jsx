// import { Plus } from "lucide-react";
// import { useNavigate } from "react-router-dom";

// export default function CreateServiceCard() {
//   const navigate = useNavigate();

//   return (
//     <button
//       onClick={() => navigate("/service-provider/create-service-offering")}
//       className="group relative flex flex-col items-center justify-center
//                  rounded-xl border-2 border-dashed border-gray-300
//                  bg-white p-8 text-center transition
//                  hover:border-black hover:bg-gray-50
//                  focus:outline-none focus:ring-2 focus:ring-black"
//     >
//       {/* Icon */}
//       <div
//         className="mb-4 flex h-14 w-14 items-center justify-center
//                    rounded-full border border-gray-300
//                    text-gray-500 transition
//                    group-hover:border-black group-hover:text-black"
//       >
//         <Plus size={28} />
//       </div>

//       {/* Text */}
//       <h3 className="text-lg font-semibold text-gray-900">
//         Create a New Service
//       </h3>
//       <p className="mt-1 text-sm text-gray-500 max-w-xs">
//         Add a new service offering so customers can discover and book you.
//       </p>

//       {/* Hover Hint */}
//       <span className="mt-4 text-sm font-medium text-black opacity-0 transition group-hover:opacity-100">
//         Get started →
//       </span>
//     </button>
//   );
// }

import { Briefcase, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CreateServiceCard() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/service-provider/create-service-offering")}
      className="group relative flex flex-col items-center justify-center 
                 rounded-xl border-2 border-dashed border-gray-300 
                 bg-white p-8 text-center transition
                 hover:border-black hover:bg-gray-50
                 focus:outline-none focus:ring-2 focus:ring-black"
    >
      {/* Icon Container */}
      <div className="relative mb-4">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full 
                     border border-gray-300 bg-white text-gray-600
                     transition group-hover:border-black group-hover:text-black"
        >
          <Briefcase size={28} />
        </div>

        {/* Plus Badge */}
        <div
          className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center 
                     justify-center rounded-full bg-black text-white"
        >
          <Plus size={14} />
        </div>
      </div>

      {/* Text */}
      <h3 className="text-lg font-semibold text-gray-900">
        Create a New Service
      </h3>
      <p className="mt-1 text-sm text-gray-500 max-w-xs">
        Add a new service offering so customers can discover and book you.
      </p>

      {/* Hover Hint */}
      <span className="mt-4 text-sm font-medium text-black opacity-0 transition group-hover:opacity-100">
        Get started →
      </span>
    </button>
  );
}
