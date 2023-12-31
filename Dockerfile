# Docker descriptor for codbex-portunus
# License - http://www.eclipse.org/legal/epl-v20.html

FROM ghcr.io/codbex/codbex-atlas:0.22.0

COPY codbex-portunus target/dirigible/repository/root/registry/public/codbex-portunus

ENV DIRIGIBLE_HOME_URL=/services/web/codbex-portunus/gen/index.html