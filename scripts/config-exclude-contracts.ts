import { subtask } from "hardhat/config";
import { TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS } from "hardhat/builtin-tasks/task-names";

subtask(TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS, async (_, { config }, runSuper) => {
  const paths: string[] = await runSuper();

  return paths.filter((solidityFilePath) => !/(^|\/)node_modules($|\/)/.test(solidityFilePath));
});
