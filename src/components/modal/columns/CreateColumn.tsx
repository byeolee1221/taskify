import { useForm, useWatch } from "react-hook-form";
import InputItem from "../../input/InputItem";
import { CancelBtn, ConfirmBtn } from "../../button/ButtonComponents";
import { useSetAtom, useAtomValue } from "jotai";
import { ColumnTitlesAtom, RefreshDashboardAtom } from "@/store/modalAtom";
import { useParams } from "next/navigation";
import useLoading from "@/hooks/useLoading";
import axios from "axios";
import toast from "react-hot-toast";
import { useToggleModal } from "@/hooks/useModal";
import toastMessages from "@/lib/toastMessage";
import { useColumn } from "@/hooks/useColumn";

const CreateColumn = () => {
  const setRefreshDashboard = useSetAtom(RefreshDashboardAtom);
  const toggleModal = useToggleModal();
  const { dashboardId } = useParams();
  const { isLoading, withLoading } = useLoading();
  const ColumnTitles = useAtomValue(ColumnTitlesAtom);
  const {
    register,
    handleSubmit,
    control,
    formState: { isValid },
  } = useForm();

  const { createColumn } = useColumn({ dashboardId: Number(dashboardId) });

  const title = useWatch({ control, name: "title" });
  const isDuplicate = ColumnTitles.includes(title);

  const onSubmit = async (data: any) => {
    await withLoading(async () => {
      try {
        await axios.post("/api/columns", { ...data, dashboardId: Number(dashboardId) });
        toast.success(toastMessages.success.createColumn);
        toggleModal("createColumn", false);
        setRefreshDashboard((prev) => !prev);
      } catch (error) {
        toast.error(toastMessages.error.createColumn);
        toggleModal("createColumn", false);
      }
    });
  };

  return (
    <div className="w-[327px] rounded-lg bg-white px-4 py-6 md:w-[568px] md:p-6">
      <h2 className="mb-4 text-2xl font-bold md:mb-6 md:text-3xl">새 컬럼 생성</h2>
      <InputItem
        id="title"
        {...register("title", { required: true })}
        label="이름"
        type="text"
        placeholder="새 컬럼 이름을 적어주세요"
        errors={isDuplicate ? "중복된 컬럼 이름입니다." : ""}
      />
      <div className="mt-6 flex h-[54px] w-full gap-2">
        <CancelBtn onClick={() => toggleModal("createColumn", false)}>취소</CancelBtn>
        <ConfirmBtn disabled={!isValid || isLoading || isDuplicate} onClick={handleSubmit(onSubmit)}>
          생성
        </ConfirmBtn>
      </div>
    </div>
  );
};

export default CreateColumn;
