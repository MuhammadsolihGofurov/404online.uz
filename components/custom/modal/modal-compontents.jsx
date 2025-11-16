import {
  EditUserModal,
  GenerateCodeModal,
  GroupModal,
  TeacherModal,
} from "./admin-center";
import {
  ConfirmModal,
  EduCenterCreateAdminModal,
  EduCenterModal,
} from "./owner";

export const ModalComponents = {
  createEduCenter: EduCenterModal,
  confirmModal: ConfirmModal,
  eduCenterCreateAdmin: EduCenterCreateAdminModal,
  addTeacher: TeacherModal,
  generateCode: GenerateCodeModal,
  editUser: EditUserModal,
  addGroup: GroupModal,
};
