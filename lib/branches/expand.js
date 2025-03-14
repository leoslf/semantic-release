import { isString, mapValues, omit, remove, template } from "lodash-es";
import micromatch from "micromatch";
import { getBranches } from "../git.js";

export default async (repositoryUrl, { cwd, options = {}, ciBranch }, branches) => {
  let gitBranches = await getBranches(repositoryUrl, { cwd });
  if (options.publishOnPr && !gitBranches.includes(ciBranch)) {
    gitBranches = [...gitBranches, ciBranch];
  }

  return branches.reduce(
    (branches, branch) => [
      ...branches,
      ...remove(gitBranches, (name) => micromatch(gitBranches, branch.name).includes(name)).map((name) => ({
        name,
        ...mapValues(omit(branch, "name"), (value) => (isString(value) ? template(value)({ name }) : value)),
      })),
    ],
    []
  );
};
