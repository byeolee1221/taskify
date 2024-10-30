import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { CiSquarePlus } from "react-icons/ci";
import { useAtom } from "jotai";
import { InvitationDashboardAtom } from "@/store/modalAtom";
import InviteItem from "./InviteItem";
import Image from "next/image";
import Pagination from "@/components/pagination/Pagination";
interface InvitationItem {
  id: number;
  inviter: {
    id: number;
    email: string;
    nickname: string;
  };
  teamId: string;
  dashboard: {
    id: number;
    title: string;
  };
  invitee: {
    id: number;
    email: string;
    nickname: string;
  };
  inviteAccepted: null | boolean;
  createdAt: string;
  updatedAt: string;
}
// onClick={() => setIsInvitationDashboardOpen(true)}
const InviteList = ({ dashboardId }: { dashboardId: number }) => {
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(1);
  const size = 5;
  const [inviteList, setInviteList] = useState<InvitationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [, setIsInvitationDashboardOpen] = useAtom(InvitationDashboardAtom);

  const totalPage: number = Math.ceil(totalCount / size);

  const fetchDashboardInvitationList = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`/api/dashboards/${dashboardId}/invitations?page=${page}&size=${size}`);
      const data = res.data;

      setTotalCount(data.totalCount);
      const uniqueMembers = data.invitations.filter(
        (invitation: InvitationItem, index: number, self: InvitationItem[]) =>
          index === self.findIndex((inv) => inv.invitee.id === invitation.invitee.id)
      );
      setInviteList(uniqueMembers);
      setTotalCount(uniqueMembers.length);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        console.error(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchDashboardInvitationList();
  }, [dashboardId]);

  useEffect(() => {
    if (!isLoading && inviteList.length > 0) {
      const uniqueMembers = inviteList.filter(
        (invitation, index, self) => index === self.findIndex((inv) => inv.invitee.id === invitation.invitee.id)
      );
      if (uniqueMembers.length !== inviteList.length) {
        setInviteList(uniqueMembers);
      }
    }
  }, [isLoading]);

  const onClickCancelInvitation = async (invitationId: number) => {
    try {
      const response = await axios.delete(`/api/dashboards/${dashboardId}/invitations/${invitationId}`);
      if (response.status === 204) {
        toast.success(`멤버 초대를 취소합니다.`);
        const newList = inviteList.filter((item) => item.id !== invitationId);
        setInviteList(newList);
      } else {
        toast.error("삭제하는 중 오류가 발생했습니다.");
      }
    } catch (err) {
      console.error(`Error deleting member: ${invitationId}`, err);
      toast.error("삭제하는 중 오류가 발생했습니다.");
    }
  };

  return (
    <>
      <div className="relative flex items-center justify-between px-5 pb-[18px] pt-[22px] md:px-7 md:py-[26px]">
        <h2 className="col-start-1 text-2xl font-bold md:text-3xl">초대 내역</h2>
        <div className="flex items-center gap-3 md:gap-4">
          <div className="text-xs font-normal md:text-base">
            {totalPage} 중 {page}
          </div>
          <Pagination totalPage={totalPage} setPage={setPage} page={page} />
          <button
            className="absolute bottom-[-26px] right-[20px] flex h-[26px] items-center gap-[10px] rounded bg-violet01 px-3 py-1 text-xs text-white md:relative md:bottom-auto md:right-auto md:h-8 md:py-2"
            type="button"
            onClick={() => setIsInvitationDashboardOpen(true)}
          >
            초대하기 <CiSquarePlus strokeWidth={1} />
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center px-5 md:px-7">
        {isLoading ? <div className="pb-5">초대 내역을 불러오고 있어요</div> : <></>}
        {error ? <div className="pb-5">초대 내역을 불러오는데 실패했습니다</div> : <></>}
        {!error && !isLoading && inviteList.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-6 pb-5 pt-10">
            <Image
              src="/images/myDashboard/invitation.svg"
              alt="초대"
              width={60}
              height={60}
              className="md:size-[100px]"
            />
            <div className="px-5 md:px-7">아직 초대된 멤버가 없습니다</div>
          </div>
        ) : (
          <></>
        )}
      </div>
      {!error && !isLoading && inviteList.length > 0 && (
        <>
          <div className="px-5 py-[1px] text-base font-normal text-gray02 md:px-7 md:text-lg">이메일</div>
          <ul>
            <li>
              {inviteList.map((item) => (
                <InviteItem key={item.id} item={item} onClick={onClickCancelInvitation} />
              ))}
            </li>
          </ul>
        </>
      )}
    </>
  );
};
export default InviteList;
