"use client";

import { ChangeEvent, useState, useEffect } from "react";
import { useForm, SubmitHandler, Controller, useWatch } from "react-hook-form";
import { useParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { CardSchema } from "@/zodSchema/cardSchema";
import axios from "axios";
import toast from "react-hot-toast";
import useLoading from "@/hooks/useLoading";
import { useAuth } from "@/hooks/useAuth";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useDashboardMember } from "@/hooks/useDashboardMember";
import { formatDateTime } from "@/utils/dateFormat";
import { CreateCardProps } from "@/types/cardType";
import { CancelBtn, ConfirmBtn } from "@/components/button/ButtonComponents";
import SearchDropdown from "@/components/dropdown/SearchDropdown";
import InputItem from "@/components/input/InputItem";
import InputDate from "@/components/input/InputDate";
import InputTag from "@/components/input/InputTag";
import InputFile from "@/components/input/InputFile";

import { useAtom, useAtomValue } from "jotai";
import { CreateCardAtom, CreateCardParamsAtom } from "@/store/modalAtom";
import { uploadType } from "@/types/uploadType";

const CreateCard = () => {
  const { user } = useAuth();
  const { dashboardId } = useParams();
  const { members } = useDashboardMember({ dashboardId: Number(dashboardId) });
  const columnId = useAtomValue(CreateCardParamsAtom);
  const [, setIsCreateCardOpen] = useAtom(CreateCardAtom);
  const { isLoading, withLoading } = useLoading();

  const {
    uploadFile,
    isPending: isFileUploading,
    error: fileError,
  } = useFileUpload(`/api/columns/${columnId}/card-image`, uploadType.CARD);

  useEffect(() => {
    if (fileError) {
      toast.error("이미지 업로드 중 오류가 발생했습니다.");
      console.error("파일 업로드 에러:", fileError);
    }
  }, [fileError]);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    control,
    formState: { errors, isValid },
  } = useForm<CreateCardProps>({
    resolver: zodResolver(CardSchema),
    mode: "onChange",
    defaultValues: {
      assigneeUserId: Number(user && user.id),
      dashboardId: Number(dashboardId),
      columnId: Number(columnId),
      title: "",
      description: "",
      dueDate: "",
      tags: [],
      imageUrl: null,
    },
  });

  const dueDate = useWatch({ control, name: "dueDate" });
  const tags = useWatch({ control, name: "tags" });

  const isFormValid = isValid && !!dueDate && tags.length > 0 && !!imageUrl && !isFileUploading;

  const handleAddTag = (tag: string) => {
    if (tagInput.trim() && !tags.includes(tag)) {
      setValue("tags", [...tags, tag]);
      setTagInput("");
    }
  };

  const handleImageChange = async (file: string | File | null) => {
    if (!file) {
      setImageUrl(null);
      setValue("imageUrl", null);
      return;
    }

    if (!(file instanceof File)) {
      return;
    }

    try {
      const uploadedUrl = await uploadFile(file);
      setImageUrl(uploadedUrl);
      setValue("imageUrl", uploadedUrl);
      toast.success("카드 이미지 업로드가 완료되었습니다.");
    } catch (error) {
      toast.error("카드 이미지 업로드에 실패했습니다.");
      console.error("이미지 업로드 에러:", error);
      setImageUrl(null);
      setValue("imageUrl", null);
    }
  };

  const onSubmit: SubmitHandler<CreateCardProps> = async (data) => {
    await withLoading(async () => {
      try {
        console.log(data);
        const response = await axios.post(`/api/cards`, data);
        if (response.data) {
          toast.success("카드가 생성되었습니다! 🎉");
          setIsCreateCardOpen(false);
        }
      } catch (error) {
        toast.error("카드 생성에 실패하였습니다.");
      }
    });
  };

  const managerValidation = register("assigneeUserId", {
    required: {
      value: true,
      message: "담당자를 선택해 주세요",
    },
  });

  return (
    <section className="w-[327px] rounded-2xl bg-white px-4 pb-5 pt-8 md:w-[584px] md:p-8 md:pt-10">
      <h3 className="mb-5 text-2xl font-bold text-black03 md:mb-6 md:text-3xl">할 일 생성</h3>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 md:gap-8">
        <Controller
          name="assignee"
          control={control}
          render={({ field }) => (
            <SearchDropdown
              inviteMemberList={members.members}
              currentManager={field.value}
              setManager={(manager) => field.onChange(manager)}
              setValue={setValue}
              validation={managerValidation}
            />
          )}
        />

        <InputItem
          label="제목"
          id="title"
          {...register("title")}
          errors={errors.title && errors.title.message}
          required
        />

        <InputItem
          label="설명"
          id="description"
          {...register("description", {
            required: "설명은 필수입니다",
            onChange: (e) => {
              setValue("description", e.target.value);
              trigger("description");
            },
          })}
          isTextArea
          size="description"
          required
          errors={errors.description && errors.description.message}
        />

        <Controller
          name="dueDate"
          control={control}
          render={({ field }) => (
            <InputDate
              label="마감일"
              id="dueDate"
              name="dueDate"
              value={field.value}
              onChange={(date) => {
                const formattedDate = date ? formatDateTime(date) : "";
                field.onChange(formattedDate);
                setValue("dueDate", formattedDate);
              }}
              placeholder="날짜를 입력해 주세요"
            />
          )}
        />

        <InputTag
          tags={tags}
          tagInput={tagInput}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddTag(tagInput);
            }
          }}
          onClick={(tag) =>
            setValue(
              "tags",
              tags.filter((t) => t !== tag)
            )
          }
          onChange={(e: ChangeEvent<HTMLInputElement>) => setTagInput(e.target.value)}
        />

        <InputFile
          label="이미지"
          id="imageUrl"
          name="imageUrl"
          value={imageUrl}
          onChange={handleImageChange}
          size="todo"
        />

        <div className="flex h-[42px] gap-3 md:h-[54px] md:gap-2">
          <CancelBtn type="button" onClick={() => setIsCreateCardOpen(false)}>
            취소
          </CancelBtn>
          <ConfirmBtn type="submit" disabled={!isFormValid || isLoading || isFileUploading}>
            생성
          </ConfirmBtn>
        </div>
      </form>
    </section>
  );
};

export default CreateCard;
