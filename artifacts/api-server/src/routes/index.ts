import { Router, type IRouter } from "express";
import healthRouter from "./health";
import statsRouter from "./stats";
import domainsRouter from "./domains";
import databasesRouter from "./databases";
import emailsRouter from "./emails";
import ftpRouter from "./ftp";
import sslRouter from "./ssl";
import dnsRouter from "./dns";
import usersRouter from "./users";
import backupsRouter from "./backups";
import subdomainsRouter from "./subdomains";
import cronjobsRouter from "./cronjobs";
import servicesRouter from "./services";

const router: IRouter = Router();

router.use(healthRouter);
router.use(statsRouter);
router.use(domainsRouter);
router.use(databasesRouter);
router.use(emailsRouter);
router.use(ftpRouter);
router.use(sslRouter);
router.use(dnsRouter);
router.use(usersRouter);
router.use(backupsRouter);
router.use(subdomainsRouter);
router.use(cronjobsRouter);
router.use(servicesRouter);

export default router;
