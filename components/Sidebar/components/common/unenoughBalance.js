import { X, Wallet, AlertCircle } from "lucide-react";
import { QRCodeImage } from "../settingPage/modules/qrcode";

const UnenoughBalance = ({ isShowModal, setIsShowModal }) => {
  const handleCloseModal = () => {
    setIsShowModal(false);
  };

  return (
    <>
      {isShowModal && (
        <div className="fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleCloseModal}
          />

          <div
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm 
              bg-white rounded-xl shadow-2xl animate-in fade-in zoom-in duration-200"
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">
                  余额不足
                </h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5">
              <div className="flex items-start gap-3">
                <Wallet className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-gray-600 leading-relaxed">
                    您目前的账户余额不足使用该模式，请切换模型或者联系管理员充值
                  </p>
                  <div className="mt-4 flex justify-center">
                    <img
                      src={QRCodeImage}
                      alt="充值二维码"
                      className="w-92 h-92 object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-5 py-4">
              <button
                className="px-6 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white 
                    shadow-sm shadow-indigo-200 transition-all duration-200 
                    hover:shadow-md hover:shadow-indigo-300"
                onClick={() => {
                  handleCloseModal();
                }}
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export { UnenoughBalance };
