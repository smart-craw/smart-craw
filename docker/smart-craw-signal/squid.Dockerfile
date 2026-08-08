FROM ubuntu/squid:7.2-26.04_edge
ADD docker/smart-craw-signal/squid.conf /etc/squid/squid.conf
ADD docker/smart-craw-signal/acl /etc/squid/acl
