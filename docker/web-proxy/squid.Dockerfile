FROM ubuntu/squid:7.2-26.04_edge
ADD docker/web-proxy/squid.conf /etc/squid/squid.conf
ADD docker/web-proxy/acl /etc/squid/acl
